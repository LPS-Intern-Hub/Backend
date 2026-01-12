// cSpell:words sakit izin Jenis harus diisi Judul karakter Alasan antara tidak Tanggal mulai selesai kadiv atau Gunakan
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const permissionController = require('../controllers/permissionController');
const { auth, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
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
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Permission not found
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
 *               - title
 *               - reason
 *               - start_date
 *               - end_date
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [sakit, izin]
 *                 description: Type of permission
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Permission title
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 description: Reason for permission
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Start date (YYYY-MM-DD)
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: End date (YYYY-MM-DD)
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: Supporting document (PDF, JPG, PNG - max 5MB)
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  auth,
  upload.single('attachment'),
  [
    body('type')
      .isIn(['sakit', 'izin'])
      .withMessage('Jenis perizinan harus sakit atau izin'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Judul harus diisi')
      .isLength({ min: 3, max: 255 })
      .withMessage('Judul harus antara 3-255 karakter'),
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
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       400:
 *         description: Permission cannot be updated (already processed)
 *       404:
 *         description: Permission not found
 */
router.put(
  '/:id',
  auth,
  upload.single('attachment'),
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
 *       400:
 *         description: Permission cannot be deleted (already processed)
 *       404:
 *         description: Permission not found
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
 *       400:
 *         description: Invalid action or permission not ready for review
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Permission not found
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
