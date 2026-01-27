// cSpell:words Tanggal harus diisi duduk kegiatan karakter Deskripsi Judul kadiv tidak Hasil atau antara Gunakan
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const logbookController = require('../controllers/logbookController');
const { auth, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Logbooks
 *   description: Logbook management
 */

/**
 * @swagger
 * /logbooks:
 *   get:
 *     summary: Get all logbooks
 *     description: Retrieve all logbooks for current user with optional filters
 *     tags: [Logbooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, review_mentor, review_kadiv, approved, rejected]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of logbooks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_logbooks:
 *                         type: integer
 *                       date:
 *                         type: string
 *                         format: date
 *                       title:
 *                         type: string
 *                       activity_detail:
 *                         type: string
 *                       result_output:
 *                         type: string
 *                       status:
 *                         type: string
 */
router.get('/', auth, logbookController.getLogbooks);

/**
 * @swagger
 * /logbooks:
 *   post:
 *     summary: Create new logbook
 *     description: Create a new logbook entry as draft or sent
 *     tags: [Logbooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - title
 *               - activity_detail
 *               - result_output
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of activity
 *                 example: "2026-01-27"
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Activity title
 *                 example: "Membuat API Dashboard"
 *               activity_detail:
 *                 type: string
 *                 minLength: 10
 *                 description: Detailed description of activity
 *                 example: "Mengimplementasikan endpoint dashboard dengan data progress magang"
 *               result_output:
 *                 type: string
 *                 minLength: 10
 *                 description: Result or output of activity
 *                 example: "Berhasil membuat endpoint /api/dashboard yang menampilkan progress magang"
 *               status:
 *                 type: string
 *                 enum: [draft, sent]
 *                 default: draft
 *                 description: Logbook status
 *     responses:
 *       201:
 *         description: Logbook created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logbook berhasil disimpan sebagai draft"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
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
 * @swagger
 * /logbooks/{id}:
 *   put:
 *     summary: Update logbook
 *     description: Update existing logbook (only if status is draft, sent, or rejected)
 *     tags: [Logbooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Logbook ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               activity_detail:
 *                 type: string
 *                 minLength: 10
 *               result_output:
 *                 type: string
 *                 minLength: 10
 *               status:
 *                 type: string
 *                 enum: [draft, sent]
 *     responses:
 *       200:
 *         description: Logbook updated successfully
 *       400:
 *         description: Cannot update logbook that has been processed
 *       404:
 *         description: Logbook not found
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
 * @swagger
 * /logbooks/{id}:
 *   delete:
 *     summary: Delete logbook
 *     description: Delete logbook (only if status is draft or sent)
 *     tags: [Logbooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Logbook ID
 *     responses:
 *       200:
 *         description: Logbook deleted successfully
 *       400:
 *         description: Cannot delete logbook that has been processed
 *       404:
 *         description: Logbook not found
 */
router.delete('/:id', auth, authorize('intern'), logbookController.deleteLogbook);

/**
 * @swagger
 * /logbooks/{id}/review:
 *   put:
 *     summary: Review logbook
 *     description: Approve or reject logbook (mentor/kadiv only)
 *     tags: [Logbooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Logbook ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Review action
 *                 example: approve
 *     responses:
 *       200:
 *         description: Logbook reviewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logbook berhasil disetujui"
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid action or status not ready for review
 *       404:
 *         description: Logbook not found
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
