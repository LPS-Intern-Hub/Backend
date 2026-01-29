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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_logbooks:
 *                         type: integer
 *                         example: 1
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2026-01-29"
 *                       activity_detail:
 *                         type: string
 *                         example: "Mengimplementasikan fitur logbook"
 *                       result_output:
 *                         type: string
 *                         example: "Berhasil membuat endpoint CRUD logbook"
 *                       status:
 *                         type: string
 *                         enum: [draft, sent, review_mentor, review_kadiv, approved, rejected]
 *                         example: "draft"
 *                       approved_by:
 *                         type: integer
 *                         nullable: true
 *                         example: null
 *                       approved_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       internship:
 *                         type: object
 *                         properties:
 *                           id_internships:
 *                             type: integer
 *                             example: 1
 *                           user:
 *                             type: object
 *                             properties:
 *                               id_users:
 *                                 type: integer
 *                                 example: 1
 *                               full_name:
 *                                 type: string
 *                                 example: "John Doe"
 *                               email:
 *                                 type: string
 *                                 example: "john.doe@example.com"
 *                               position:
 *                                 type: string
 *                                 example: "Backend Developer"
 *       404:
 *         description: Internship data not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Data magang tidak ditemukan"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan saat mengambil data logbook"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
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
 *               - activity_detail
 *               - result_output
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of activity
 *                 example: "2026-01-27"
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
 *                   properties:
 *                     id_logbooks:
 *                       type: integer
 *                       example: 1
 *                     id_internships:
 *                       type: integer
 *                       example: 1
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-29"
 *                     activity_detail:
 *                       type: string
 *                       example: "Mengimplementasikan fitur logbook"
 *                     result_output:
 *                       type: string
 *                       example: "Berhasil membuat endpoint CRUD logbook"
 *                     status:
 *                       type: string
 *                       enum: [draft, sent]
 *                       example: "draft"
 *                     approved_by:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: "Tanggal harus diisi"
 *                       param:
 *                         type: string
 *                         example: "date"
 *                       location:
 *                         type: string
 *                         example: "body"
 *       404:
 *         description: Internship data not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Data magang tidak ditemukan"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan saat membuat logbook"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
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
 *     description: Update logbook entry (only if status is draft or rejected)
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
 *                   example: "Logbook berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_logbooks:
 *                       type: integer
 *                       example: 1
 *                     id_internships:
 *                       type: integer
 *                       example: 1
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-29"
 *                     activity_detail:
 *                       type: string
 *                       example: "Mengimplementasikan fitur logbook"
 *                     result_output:
 *                       type: string
 *                       example: "Berhasil membuat endpoint CRUD logbook"
 *                     status:
 *                       type: string
 *                       enum: [draft, sent, review_mentor, review_kadiv, approved, rejected]
 *                       example: "draft"
 *                     approved_by:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Cannot update logbook that has been processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Logbook yang sudah diajukan tidak dapat diubah. Tunggu sampai ditolak untuk melakukan revisi"
 *       404:
 *         description: Logbook not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Logbook tidak ditemukan"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan saat memperbarui logbook"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
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
 *     description: Delete logbook (only if status is draft or rejected)
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
 *                   example: "Logbook berhasil dihapus"
 *       400:
 *         description: Cannot delete logbook that has been processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Logbook yang sudah diajukan tidak dapat dihapus. Tunggu sampai ditolak untuk melakukan revisi"
 *       404:
 *         description: Logbook or internship not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Logbook tidak ditemukan"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan saat menghapus logbook"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.delete('/:id', auth, authorize('intern'), logbookController.deleteLogbook);

/**
 * @swagger
 * /logbooks/{id}:
 *   get:
 *     summary: Get logbook by ID
 *     description: Retrieve a specific logbook entry with full details
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
 *         description: Logbook details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_logbooks:
 *                       type: integer
 *                     id_internships:
 *                       type: integer
 *                     date:
 *                       type: string
 *                       format: date
 *                     activity_detail:
 *                       type: string
 *                     result_output:
 *                       type: string
 *                       example: "Berhasil membuat endpoint CRUD logbook"
 *                     status:
 *                       type: string
 *                       enum: [draft, sent, review_mentor, review_kadiv, approved, rejected]
 *                       example: "draft"
 *                     approved_by:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *       404:
 *         description: Logbook or internship not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Logbook tidak ditemukan"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan saat mengambil data logbook"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/:id', auth, logbookController.getLogbookById);

/**
 * @swagger
 * /logbooks/submit-monthly:
 *   post:
 *     summary: Submit all draft logbooks for a month
 *     description: Change status of all draft logbooks in specified month to 'sent' for mentor review
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
 *               - month
 *               - year
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Month number (1-12)
 *                 example: 1
 *               year:
 *                 type: integer
 *                 description: Year
 *                 example: 2026
 *     responses:
 *       200:
 *         description: Logbooks submitted successfully
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
 *                   example: "10 logbook berhasil diajukan ke mentor"
 *                 data:
 *                   type: object
 *                   properties:
 *                     submitted_count:
 *                       type: integer
 *                       example: 10
 *                     month:
 *                       type: integer
 *                       example: 1
 *                     year:
 *                       type: integer
 *                       example: 2026
 *       400:
 *         description: Invalid month or year
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Bulan harus antara 1-12"
 *       404:
 *         description: No draft logbooks found for specified month or internship not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Tidak ada logbook draft untuk bulan tersebut"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan saat mengajukan logbook"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.post(
  '/submit-monthly',
  auth,
  authorize('intern'),
  [
    body('month')
      .notEmpty()
      .withMessage('Bulan harus diisi')
      .isInt({ min: 1, max: 12 })
      .withMessage('Bulan harus antara 1-12'),
    body('year')
      .notEmpty()
      .withMessage('Tahun harus diisi')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Tahun tidak valid')
  ],
  logbookController.submitMonthlyLogbooks
);

/**
 * @swagger
 * /logbooks/{id}/review:
 *   put:
 *     summary: Review logbook
 *     description: Approve or reject logbook (mentor/kadiv only). Mentor approves sent logbooks to kadiv, kadiv gives final approval.
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
 *                   properties:
 *                     id_logbooks:
 *                       type: integer
 *                       example: 1
 *                     id_internships:
 *                       type: integer
 *                       example: 1
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-29"
 *                     activity_detail:
 *                       type: string
 *                       example: "Mengimplementasikan fitur logbook"
 *                     result_output:
 *                       type: string
 *                       example: "Berhasil membuat endpoint CRUD logbook"
 *                     status:
 *                       type: string
 *                       enum: [review_kadiv, approved, rejected]
 *                       example: "review_kadiv"
 *                     approved_by:
 *                       type: integer
 *                       example: 2
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-29T10:30:00.000Z"
 *       400:
 *         description: Invalid action or status not ready for review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Status logbook tidak sesuai untuk direview"
 *       404:
 *         description: Logbook not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Logbook tidak ditemukan"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan saat mereview logbook"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
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
