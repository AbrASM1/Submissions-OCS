const express = require('express');
const { downloadTeamZip, downloadAllZips } = require('../controllers/downloadController');
const checkPassword = require('../middlewares/checkPassword');
const router = express.Router();

router.get('/download/team/:teamName', checkPassword,downloadTeamZip);
router.get('/download/all',checkPassword, downloadAllZips);

module.exports = router;
