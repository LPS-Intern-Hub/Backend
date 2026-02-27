const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { auth, authorize } = require('../middlewares/auth');

// Public/All roles can see announcements
router.get('/', auth, announcementController.getAllAnnouncements);

// Specific for Admin
router.post('/', auth, authorize('admin'), announcementController.createAnnouncement);
router.put('/:id', auth, authorize('admin'), announcementController.updateAnnouncement);
router.delete('/:id', auth, authorize('admin'), announcementController.deleteAnnouncement);

module.exports = router;
