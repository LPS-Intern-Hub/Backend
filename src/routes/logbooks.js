// cSpell:words Tanggal harus diisi duduk kegiatan karakter Deskripsi Judul kadiv tidak Hasil atau antara Gunakan
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const logbookController = require('../controllers/logbookController');
const { auth, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/logbooks
 * @desc    Get all logbooks for current user
 * @access  Private
 * @query   status (optional) - Filter by status
 * @query   month (optional) - Filter by month (1-12)
 * @query   year (optional) - Filter by year
 */
router.get('/', auth, logbookController.getLogbooks);

/**
 * @route   GET /api/logbooks/stats
 * @desc    Get logbook statistics
 * @access  Private
 */
router.get('/stats', auth, logbookController.getLogbookStats);

/**
 * @route   GET /api/logbooks/:id
 * @desc    Get logbook by ID
 * @access  Private
 */
router.get('/:id', auth, logbookController.getLogbookById);

/**
 * @route   POST /api/logbooks
 * @desc    Create new logbook
 * @access  Private (intern)
 */
router.post(
  '/',
  auth,
  authorize('intern'),
  [
    body('date')
      .notEmpty()
      .withMessage('Tanggal harus diisi')
      .isISO8601()
      .withMessage('Format tanggal tidak valid'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Judul kegiatan harus diisi')
      .isLength({ min: 3, max: 255 })
      .withMessage('Judul harus antara 3-255 karakter'),
    body('activity_detail')
      .trim()
      .notEmpty()
      .withMessage('Deskripsi kegiatan harus diisi')
      .isLength({ min: 10 })
      .withMessage('Deskripsi kegiatan minimal 10 karakter'),
    body('result_output')
      .trim()
      .notEmpty()
      .withMessage('Hasil/output harus diisi')
      .isLength({ min: 10 })
      .withMessage('Hasil/output minimal 10 karakter'),
    body('status')
      .optional()
      .isIn(['draft', 'sent'])
      .withMessage('Status harus draft atau sent')
  ],
  logbookController.createLogbook
);

/**
 * @route   PUT /api/logbooks/:id
 * @desc    Update logbook
 * @access  Private (intern, only draft/sent/rejected status)
 */
router.put(
  '/:id',
  auth,
  authorize('intern'),
  [
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Format tanggal tidak valid'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Judul harus antara 3-255 karakter'),
    body('activity_detail')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Deskripsi kegiatan minimal 10 karakter'),
    body('result_output')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Hasil/output minimal 10 karakter'),
    body('status')
      .optional()
      .isIn(['draft', 'sent'])
      .withMessage('Status harus draft atau sent')
  ],
  logbookController.updateLogbook
);

/**
 * @route   DELETE /api/logbooks/:id
 * @desc    Delete logbook
 * @access  Private (intern, only draft/sent/rejected status)
 */
router.delete('/:id', auth, authorize('intern'), logbookController.deleteLogbook);

/**
 * @route   PUT /api/logbooks/:id/review
 * @desc    Review logbook (approve/reject)
 * @access  Private (mentor, kadiv)
 */
router.put(
  '/:id/review',
  auth,
  authorize('mentor', 'kadiv'),
  [
    body('action')
      .notEmpty()
      .withMessage('Action harus diisi')
      .isIn(['approve', 'reject'])
      .withMessage('Action tidak valid. Gunakan "approve" atau "reject"')
  ],
  logbookController.reviewLogbook
);

module.exports = router;
