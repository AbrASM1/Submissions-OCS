const express = require('express');
const { exportSubmissions } = require('../controllers/exportController');
const checkPassword = require('../middlewares/checkPassword');
const router = express.Router();

router.get('/export-submissions', checkPassword ,exportSubmissions);

module.exports = router;
