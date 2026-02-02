// cSpell:words sakit izin Jenis harus diisi Judul karakter Alasan antara tidak Tanggal mulai selesai kadiv atau Gunakan
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const permissionController = require('../controllers/permissionController');
const { auth, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Leave and sick permission management
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve all permissions for the current user with optional filters
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [sent, review_mentor, review_kadiv, approved, rejected]
 *         description: Filter by permission status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sakit, izin]
 *         description: Filter by permission type
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
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
 *                       id_permissions:
 *                         type: integer
 *                         example: 1
 *                       type:
 *                         type: string
 *                         enum: [sakit, izin]
 *                         example: "sakit"
 *                       title:
 *                         type: string
 *                         example: "Izin Sakit"
 *                       reason:
 *                         type: string
 *                         example: "Demam tinggi dan perlu istirahat"
 *                       start_date:
 *                         type: string
 *                         format: date
 *                         example: "2026-01-27"
 *                       end_date:
 *                         type: string
 *                         format: date
 *                         example: "2026-01-29"
 *                       status:
 *                         type: string
 *                         enum: [pending, review_mentor, review_kadiv, approved, rejected]
 *                         example: "pending"
 *                       approved_by:
 *                         type: integer
 *                         nullable: true
 *                         example: null
 *                       approved_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       duration_days:
 *                         type: integer
 *                         example: 3
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
 *                                 example: 10
 *                               full_name:
 *                                 type: string
 *                                 example: "Ahmad Zaki"
 *                               email:
 *                                 type: string
 *                                 example: "ahmad.zaki@example.com"
 *                               position:
 *                                 type: string
 *                                 example: "Backend Developer Intern"
 *       404:
 *         description: Internship not found
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
 *                   example: "Terjadi kesalahan saat mengambil data perizinan"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/', auth, permissionController.getPermissions);

/**
 * @swagger
 * /permissions/{id}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission found
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
 *                     id_permissions:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       example: "sakit"
 *                     title:
 *                       type: string
 *                       example: "Izin Sakit"
 *                     reason:
 *                       type: string
 *                       example: "Demam tinggi"
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     approved_by:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     duration_days:
 *                       type: integer
 *                       example: 3
 *                     internship:
 *                       type: object
 *                       properties:
 *                         id_internships:
 *                           type: integer
 *                           example: 1
 *                         user:
 *                           type: object
 *                           properties:
 *                             id_users:
 *                               type: integer
 *                               example: 10
 *                             full_name:
 *                               type: string
 *                               example: "Ahmad Zaki"
 *                             email:
 *                               type: string
 *                               example: "ahmad.zaki@example.com"
 *                             position:
 *                               type: string
 *                               example: "Backend Developer Intern"
 *                             role:
 *                               type: string
 *                               example: "intern"
 *                     approver:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id_users:
 *                           type: integer
 *                           example: 5
 *                         full_name:
 *                           type: string
 *                           example: "Budi Santoso"
 *                         role:
 *                           type: string
 *                           example: "mentor"
 *       404:
 *         description: Permission or internship not found
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
 *                   example: "Perizinan tidak ditemukan"
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
 *                   example: "Terjadi kesalahan saat mengambil data perizinan"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/:id', auth, permissionController.getPermissionById);

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create new permission
 *     description: Submit a new leave or sick permission request with optional attachment
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - reason
 *               - start_date
 *               - end_date
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [sakit, izin]
 *                 description: Type of permission
 *                 example: sakit
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 description: Reason for permission
 *                 example: "Demam tinggi dan perlu istirahat total"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Start date (YYYY-MM-DD)
 *                 example: "2026-01-27"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: End date (YYYY-MM-DD)
 *                 example: "2026-01-29"
 *     responses:
 *       201:
 *         description: Permission created successfully
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
 *                   example: "Perizinan berhasil diajukan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_permissions:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       example: "sakit"
 *                     title:
 *                       type: string
 *                       example: "Izin Sakit"
 *                     reason:
 *                       type: string
 *                       example: "Demam tinggi dan perlu istirahat"
 *                     start_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-27"
 *                     end_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-29"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     internship:
 *                       type: object
 *                       properties:
 *                         id_internships:
 *                           type: integer
 *                           example: 1
 *                         user:
 *                           type: object
 *                           properties:
 *                             id_users:
 *                               type: integer
 *                               example: 10
 *                             full_name:
 *                               type: string
 *                               example: "Ahmad Zaki"
 *                             email:
 *                               type: string
 *                               example: "ahmad.zaki@example.com"
 *                             position:
 *                               type: string
 *                               example: "Backend Developer Intern"
 *       400:
 *         description: Validation error or invalid date range
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
 *                   example: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai"
 *       404:
 *         description: Internship not found
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
 *                   example: "Terjadi kesalahan saat mengajukan perizinan"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.post(
  '/',
  auth,
  [
    body('type')
      .isIn(['sakit', 'izin'])
      .withMessage('Jenis perizinan harus sakit atau izin'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Alasan harus diisi')
      .isLength({ min: 10 })
      .withMessage('Alasan minimal 10 karakter'),
    body('start_date')
      .notEmpty()
      .withMessage('Tanggal mulai harus diisi')
      .isISO8601()
      .withMessage('Format tanggal tidak valid'),
    body('end_date')
      .notEmpty()
      .withMessage('Tanggal selesai harus diisi')
      .isISO8601()
      .withMessage('Format tanggal tidak valid')
  ],
  permissionController.createPermission
);

/**
 * @swagger
 * /permissions/{id}:
 *   put:
 *     summary: Update permission
 *     description: Update an existing permission (only if status is 'sent')
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated successfully
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
 *                   example: "Perizinan berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_permissions:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       example: "sakit"
 *                     title:
 *                       type: string
 *                       example: "Izin Sakit"
 *                     reason:
 *                       type: string
 *                       example: "Demam tinggi"
 *                     start_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-27"
 *                     end_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-29"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     approved_by:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     internship:
 *                       type: object
 *                       properties:
 *                         id_internships:
 *                           type: integer
 *                           example: 1
 *                         user:
 *                           type: object
 *                           properties:
 *                             id_users:
 *                               type: integer
 *                               example: 10
 *                             full_name:
 *                               type: string
 *                               example: "Ahmad Zaki"
 *                             email:
 *                               type: string
 *                               example: "ahmad.zaki@example.com"
 *                             position:
 *                               type: string
 *                               example: "Backend Developer Intern"
 *       400:
 *         description: Permission already processed, cannot be updated
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
 *                   example: "Perizinan yang sudah diproses tidak dapat diubah"
 *       404:
 *         description: Permission or internship not found
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
 *                   example: "Perizinan tidak ditemukan"
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
 *                   example: "Terjadi kesalahan saat memperbarui perizinan"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.put(
  '/:id',
  auth,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Judul harus antara 3-255 karakter'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Alasan minimal 10 karakter')
  ],
  permissionController.updatePermission
);

/**
 * @swagger
 * /permissions/{id}:
 *   delete:
 *     summary: Delete permission
 *     description: Delete a permission (only if status is 'sent')
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission deleted successfully
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
 *                   example: "Perizinan berhasil dihapus"
 *       400:
 *         description: Permission already processed, cannot be deleted
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
 *                   example: "Perizinan yang sudah diproses tidak dapat dihapus"
 *       404:
 *         description: Permission or internship not found
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
 *                   example: "Perizinan tidak ditemukan"
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
 *                   example: "Terjadi kesalahan saat menghapus perizinan"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.delete('/:id', auth, permissionController.deletePermission);

/**
 * @swagger
 * /permissions/{id}/review:
 *   put:
 *     summary: Review permission (approve/reject)
 *     description: Approve or reject a permission request (mentor/kadiv only)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                 description: Action to take
 *     responses:
 *       200:
 *         description: Permission reviewed successfully
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
 *                   example: "Perizinan berhasil disetujui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_permissions:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       example: "sakit"
 *                     title:
 *                       type: string
 *                       example: "Izin Sakit"
 *                     reason:
 *                       type: string
 *                       example: "Demam tinggi"
 *                     start_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-27"
 *                     end_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-29"
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     approved_by:
 *                       type: integer
 *                       example: 5
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-29T10:30:00Z"
 *                     internship:
 *                       type: object
 *                       properties:
 *                         id_internships:
 *                           type: integer
 *                           example: 1
 *                         user:
 *                           type: object
 *                           properties:
 *                             id_users:
 *                               type: integer
 *                               example: 10
 *                             full_name:
 *                               type: string
 *                               example: "Ahmad Zaki"
 *                             email:
 *                               type: string
 *                               example: "ahmad.zaki@example.com"
 *                             position:
 *                               type: string
 *                               example: "Backend Developer Intern"
 *                     approver:
 *                       type: object
 *                       properties:
 *                         id_users:
 *                           type: integer
 *                           example: 5
 *                         full_name:
 *                           type: string
 *                           example: "Budi Santoso"
 *                         role:
 *                           type: string
 *                           example: "mentor"
 *       400:
 *         description: Invalid action
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
 *                   example: "Action tidak valid. Gunakan \"approve\" atau \"reject\""
 *       404:
 *         description: Permission not found
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
 *                   example: "Perizinan tidak ditemukan"
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
 *                   example: "Terjadi kesalahan saat mereview perizinan"
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
      .isIn(['approve', 'reject'])
      .withMessage('Action harus approve atau reject')
  ],
  permissionController.reviewPermission
);

module.exports = router;
