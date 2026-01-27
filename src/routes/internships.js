const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const internshipController = require('../controllers/internshipController');
const { auth, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Internships
 *   description: Internship management endpoints
 */

/**
 * @swagger
 * /internships/me:
 *   get:
 *     summary: Get current user's internship data
 *     tags: [Internships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Internship data retrieved successfully
 *       404:
 *         description: Internship not found
 */
router.get('/me', auth, internshipController.getMyInternship);

/**
 * @swagger
 * /internships:
 *   get:
 *     summary: Get all internships (Admin only)
 *     tags: [Internships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [aktif, selesai, diberhentikan]
 *     responses:
 *       200:
 *         description: List of internships
 */
router.get(
    '/',
    auth,
    authorize('admin'),
    internshipController.getAllInternships
);

/**
 * @swagger
 * /internships/{id}:
 *   get:
 *     summary: Get internship by ID (Admin only)
 *     tags: [Internships]
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
 *         description: Internship data
 *       404:
 *         description: Internship not found
 */
router.get(
    '/:id',
    auth,
    authorize('admin'),
    internshipController.getInternshipById
);

/**
 * @swagger
 * /internships:
 *   post:
 *     summary: Create new internship (Admin only)
 *     tags: [Internships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_users
 *               - start_date
 *               - end_date
 *             properties:
 *               id_users:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [aktif, selesai, diberhentikan]
 *     responses:
 *       201:
 *         description: Internship created successfully
 */
router.post(
    '/',
    auth,
    authorize('admin'),
    [
        body('id_users')
            .notEmpty()
            .withMessage('ID user harus diisi')
            .isInt()
            .withMessage('ID user harus berupa angka'),
        body('start_date')
            .notEmpty()
            .withMessage('Tanggal mulai harus diisi')
            .isISO8601()
            .withMessage('Format tanggal mulai tidak valid'),
        body('end_date')
            .notEmpty()
            .withMessage('Tanggal selesai harus diisi')
            .isISO8601()
            .withMessage('Format tanggal selesai tidak valid'),
        body('status')
            .optional()
            .isIn(['aktif', 'selesai', 'diberhentikan'])
            .withMessage('Status tidak valid')
    ],
    internshipController.createInternship
);

/**
 * @swagger
 * /internships/{id}:
 *   put:
 *     summary: Update internship (Admin only)
 *     tags: [Internships]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [aktif, selesai, diberhentikan]
 *     responses:
 *       200:
 *         description: Internship updated successfully
 */
router.put(
    '/:id',
    auth,
    authorize('admin'),
    internshipController.updateInternship
);

/**
 * @swagger
 * /internships/{id}:
 *   delete:
 *     summary: Delete internship (Admin only)
 *     tags: [Internships]
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
 *         description: Internship deleted successfully
 */
router.delete(
    '/:id',
    auth,
    authorize('admin'),
    internshipController.deleteInternship
);

module.exports = router;
