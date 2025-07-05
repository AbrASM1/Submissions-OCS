const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const db = require('../model/db');
const fse = require('fs-extra');

const getTeamFiles = (teamName) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.id as submission_id, f.filename, f.originalname, f.path
        FROM submissions s
        JOIN submission_files f ON s.id = f.submission_id
        WHERE TRIM(s.team_name) = TRIM(?)
        ORDER BY s.submitted_at ASC
      `;
      db.query(query, [teamName], (err, rows) => {
        if (err) return reject(err);
        const grouped = {};
        for (const row of rows) {
          if (!grouped[row.submission_id]) grouped[row.submission_id] = [];
          grouped[row.submission_id].push(row);
        }
        resolve(grouped);
      });
    });
};  

const getAllTeamFiles = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.team_name, s.id AS submission_id, f.filename, f.originalname, f.path
        FROM submissions s
        JOIN submission_files f ON s.id = f.submission_id
        ORDER BY s.team_name, s.submitted_at ASC
      `;
      db.query(query, (err, rows) => {
        if (err) return reject(err);
        const grouped = {};
        for (const row of rows) {
          const key = `${row.team_name.trim()}__${row.submission_id}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(row);
        }
        resolve(grouped);
      });
    });
};
  

// ✅ /api/download/team/:teamName
const downloadTeamZip = async (req, res) => {
    const teamName = req.params.teamName.trim();

    try {
        const submissions = await getTeamFiles(teamName);
        const submissionIds = Object.keys(submissions);

        if (submissionIds.length === 0) {
        return res.status(404).json({ error: 'No files found for this team.' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${teamName}_submissions.zip"`);
        res.setHeader('Content-Type', 'application/zip');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        let count = 1;
        for (const [submissionId, files] of Object.entries(submissions)) {
        const subZip = archiver('zip');
        const tmpZip = path.join(__dirname, `../tmp/${teamName}_submission_${count}.zip`);

        await fse.ensureDir(path.join(__dirname, '../tmp'));
        const output = fs.createWriteStream(tmpZip);
        subZip.pipe(output);

        for (const file of files) {
            const filePath = path.resolve(file.path);
            if (fs.existsSync(filePath)) {
            subZip.file(filePath, { name: file.originalname });
            }
        }

        await subZip.finalize();
        await new Promise((resolve) => output.on('close', resolve));
        archive.file(tmpZip, { name: `${teamName}_submission_${count}.zip` });
        count++;
        }

        await archive.finalize();

        // Cleanup
        const tmpDir = path.join(__dirname, '../tmp');
        fs.readdirSync(tmpDir).forEach(file => fs.unlinkSync(path.join(tmpDir, file)));

    } catch (err) {
        console.error('[ERROR - downloadTeamZip]', err);
        res.status(500).json({ error: 'Failed to generate team zip.' });
    }
};
  
  

// ✅ /api/download/all
const downloadAllZips = async (req, res) => {
    try {
      const teams = await getAllTeamFiles();
  
      if (Object.keys(teams).length === 0) {
        return res.status(404).json({ error: 'No team files found.' });
      }
  
      res.setHeader('Content-Disposition', 'attachment; filename="all_teams.zip"');
      res.setHeader('Content-Type', 'application/zip');
  
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);
  
      await fse.ensureDir(path.join(__dirname, '../tmp'));
  
      for (const [key, files] of Object.entries(teams)) {
        const [teamName, submissionId] = key.split('__');
        const safeName = `${teamName}_submission_${submissionId}`;
        const tmpPath = path.join(__dirname, `../tmp/${safeName}.zip`);
        const output = fs.createWriteStream(tmpPath);
        const subArchive = archiver('zip');
  
        subArchive.pipe(output);
  
        for (const file of files) {
          const filePath = path.resolve(file.path);
          if (fs.existsSync(filePath)) {
            subArchive.file(filePath, { name: file.originalname });
          }
        }
  
        await subArchive.finalize();
        await new Promise((resolve) => output.on('close', resolve));
        archive.file(tmpPath, { name: `${safeName}.zip` });
      }
  
      await archive.finalize();
  
      const tmpDir = path.join(__dirname, '../tmp');
      fs.readdirSync(tmpDir).forEach(file => fs.unlinkSync(path.join(tmpDir, file)));
  
    } catch (err) {
      console.error('[ERROR - downloadAllZips]', err);
      res.status(500).json({ error: 'Failed to generate combined zip.' });
    }
};
  

module.exports = { downloadTeamZip, downloadAllZips };
