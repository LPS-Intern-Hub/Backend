const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, authorize } = require('../middlewares/auth');

router.get('/export', auth, authorize('admin'), reportController.exportReportExcel);

module.exports = router;
