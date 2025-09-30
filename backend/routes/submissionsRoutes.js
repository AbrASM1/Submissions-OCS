const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submit } = require('../controllers/submissionController');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, uniqueSuffix + '-' + file.originalname);
  }});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5                    // max 5 files
  }
}).array('files');

router.post('/submit', (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Maximum 5 files are allowed.' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Each file must be smaller than 10MB.' });
      }
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Unexpected error during file upload.' });
    }

    // No errors → pass to controller
    submit(req, res);
  });
});

module.exports = router;
