const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { auth, authorize } = require('../middlewares/auth');

router.get('/', auth, authorize('admin'), auditLogController.getAllAuditLogs);

module.exports = router;
