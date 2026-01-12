// cSpell:words Absen Masuk Lokasi diisi karakter maksimal Pulang harus
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const presenceController = require('../controllers/presenceController');
const { auth, authorize } = require('../middlewares/auth');
const uploadPresence = require('../middlewares/uploadPresence');

/**
 * @swagger
 * tags:
 *   name: Presences
 *   description: Attendance and presence management
 */

/**
 * @swagger
 * /presences/check-in:
 *   post:
 *     summary: Check-in attendance
 *     description: Record check-in with photo and location
 *     tags: [Presences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - image
 *             properties:
 *               location:
 *                 type: string
 *                 maxLength: 255
 *                 description: Check-in location
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Photo for check-in (JPG/PNG - max 5MB)
 *     responses:
 *       201:
 *         description: Check-in successful
 *       400:
 *         description: Already checked in today or validation error
 */
router.post(
  '/check-in',
  auth,
  authorize('intern'),
  uploadPresence.single('image'),
  [
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Lokasi harus diisi')
      .isLength({ max: 255 })
      .withMessage('Lokasi maksimal 255 karakter')
  ],
  presenceController.checkIn
);

/**
 * @route   POST /api/presences/check-out
 * @desc    Check-out (Absen Pulang)
 * @access  Private (intern)
 */
router.post(
  '/check-out',
  auth,
  authorize('intern'),
  presenceController.checkOut
);

/**
 * @route   GET /api/presences/today
 * @desc    Get today's presence
 * @access  Private
 */
router.get('/today', auth, presenceController.getTodayPresence);

/**
 * @route   GET /api/presences/stats
 * @desc    Get presence statistics
 * @access  Private
 */
router.get('/stats', auth, presenceController.getPresenceStats);

/**
 * @route   GET /api/presences
 * @desc    Get all presences for current user
 * @access  Private
 * @query   status (optional) - Filter by status
 * @query   month (optional) - Filter by month (1-12)
 * @query   year (optional) - Filter by year
 */
router.get('/', auth, presenceController.getPresences);

/**
 * @route   GET /api/presences/:id
 * @desc    Get presence by ID
 * @access  Private
 */
router.get('/:id', auth, presenceController.getPresenceById);

module.exports = router;
