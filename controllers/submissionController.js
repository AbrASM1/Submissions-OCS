const db = require('../model/db');
const path = require('path');

const submit = (req, res) => {
  const { team_name, note } = req.body;

  let links = [];
  try {
    links = Array.isArray(req.body.links)
      ? req.body.links
      : req.body.links
        ? JSON.parse(req.body.links)
        : [];
  
    // ✅ Enforce max 10 links
    if (links.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 links are allowed.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid link format.' });
  }

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Transaction failed' });

    // 1. Insert into submissions
    db.query(
      'INSERT INTO submissions (team_name, note) VALUES (?, ?)',
      [team_name, note || null],
      (err, result) => {
        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

        const submissionId = result.insertId;

        // 2. Insert links (label + url)
        const linkInserts = links
          .filter(link => link.url) // avoid empty links
          .map(link => [submissionId, link.label || null, link.url]);

        const insertLinks = (cb) => {
          if (linkInserts.length === 0) return cb();
          db.query(
            'INSERT INTO submission_links (submission_id, label, url) VALUES ?',
            [linkInserts],
            err => {
              if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
              cb();
            }
          );
        };

        // 3. Insert files
        const fileInserts = req.files.map(file => [
          submissionId,
          file.filename,
          file.path,
          file.originalname
        ]);

        const insertFiles = (cb) => {
          if (fileInserts.length === 0) return cb();
          db.query(
            'INSERT INTO submission_files (submission_id, filename, path, originalname) VALUES ?',
            [fileInserts],
            err => {
              if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
              cb();
            }
          );
        };

        // Insert in order: links -> files -> commit
        insertLinks(() => {
          insertFiles(() => {
            db.commit(err => {
              if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
              res.status(200).json({ message: 'Submission successful' });
            });
          });
        });
      }
    );
  });
};

module.exports = { submit };
