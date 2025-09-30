const db = require('../model/db');

const submit = (req, res) => {
  const { team_name, note } = req.body;

  // 🧹 Validate team name
  if (!team_name || typeof team_name !== 'string') {
    return res.status(400).json({ error: 'Team name is required.' });
  }

  // ✅ Parse and validate links
  let links = [];
  try {
    const rawLinks = req.body.links;

    links = Array.isArray(rawLinks)
      ? rawLinks
      : rawLinks
        ? JSON.parse(rawLinks)
        : [];

    if (links.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 links are allowed.' });
    }

    // optional: validate structure of each link
    for (const link of links) {
      if (!link.url || typeof link.url !== 'string') {
        return res.status(400).json({ error: 'Each link must include a valid URL.' });
      }
    }
  } catch {
    return res.status(400).json({ error: 'Invalid link format.' });
  }

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Transaction failed.' });

    // 1. Insert submission
    const insertSubmission = 'INSERT INTO submissions (team_name, note) VALUES (?, ?)';
    db.query(insertSubmission, [team_name, note || null], (err, result) => {
      if (err) return db.rollback(() => res.status(500).json({ error: err.message }));

      const submissionId = result.insertId;

      // 2. Insert links
      const linkValues = links.map(link => [submissionId, link.label || null, link.url]);

      const insertLinks = (cb) => {
        if (linkValues.length === 0) return cb();
        const sql = 'INSERT INTO submission_links (submission_id, label, url) VALUES ?';
        db.query(sql, [linkValues], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
          cb();
        });
      };

      // 3. Insert files
      const fileValues = req.files.map(file => [
        submissionId,
        file.filename,
        file.path,
        file.originalname
      ]);

      const insertFiles = (cb) => {
        if (fileValues.length === 0) return cb();
        const sql = 'INSERT INTO submission_files (submission_id, filename, path, originalname) VALUES ?';
        db.query(sql, [fileValues], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
          cb();
        });
      };

      // Chain insert operations
      insertLinks(() => {
        insertFiles(() => {
          db.commit((err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
            res.status(200).json({ message: 'Submission successful.' });
          });
        });
      });
    });
  });
};

module.exports = { submit };
