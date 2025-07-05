const db = require('../model/db');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const exportSubmissions = async (req, res) => {

  // 1. Get submissions
  db.query('SELECT id, team_name, note FROM submissions ORDER BY team_name ASC', (err, submissions) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch submissions' });

    const submissionIds = submissions.map(sub => sub.id);
    if (submissionIds.length === 0) {
      return res.status(200).json({ message: 'No submissions yet.' });
    }

    // 2. Get links
    db.query('SELECT submission_id, label, url FROM submission_links WHERE submission_id IN (?)', [submissionIds], (err, links) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch links' });

      // 3. Get files
      db.query('SELECT submission_id, originalname FROM submission_files WHERE submission_id IN (?)', [submissionIds], async (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch files' });

        // Group data
        const grouped = {};
        for (const sub of submissions) {
          grouped[sub.id] = {
            team_name: sub.team_name,
            note: sub.note,
            links: [],
            files: []
          };
        }

        for (const link of links) {
          grouped[link.submission_id]?.links.push(`${link.label || 'Link'}: ${link.url}`);
        }

        for (const file of files) {
          grouped[file.submission_id]?.files.push(file.originalname);
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Submissions');

        // Header row
        worksheet.columns = [
          { header: 'Team Name', key: 'team_name', width: 25 },
          { header: 'Note', key: 'note', width: 30 },
          { header: 'Links', key: 'links', width: 50 },
          { header: 'Files', key: 'files', width: 40 }
        ];

        const colorPalette = [
            'FFCCCC', 'FFCC99', 'FFFF99', 'CCFF99', '99FF99', '99FFCC', '99FFFF',
            '99CCFF', '9999FF', 'CC99FF', 'FF99FF', 'FF99CC', 'FF9999', 'FFB6C1',
            'FFE4B5', 'FAFAD2', 'E0FFFF', 'D8BFD8', 'E6E6FA', 'F0FFF0', 'F5DEB3',
            'FFEFD5', 'F5F5DC', 'F8F8FF', 'FFFACD', 'FFF5EE', 'F0F8FF', 'E0EEE0'
          ];
          
        let colorIndex = 0;

        for (const entry of Object.values(grouped)) {
          const row = worksheet.addRow({
            team_name: entry.team_name,
            note: entry.note,
            links: entry.links.join('\n'),
            files: entry.files.join('\n')
          });

          // Apply fill color
          const fillColor = colorPalette[colorIndex % colorPalette.length];
          row.eachCell(cell => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: fillColor }
            };
            cell.alignment = { vertical: 'top', wrapText: true };
          });

          colorIndex++;
        }

        // Save and send
        const filePath = path.join(__dirname, '../exports/submissions.xlsx');
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, 'submissions.xlsx', err => {
          if (err) console.error('Download error:', err);
          fs.unlink(filePath, () => {}); // cleanup
        });
      });
    });
  });
};

module.exports = { exportSubmissions };
