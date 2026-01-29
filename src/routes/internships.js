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
 *                     id_internships:
 *                       type: integer
 *                       example: 1
 *                     id_users:
 *                       type: integer
 *                       example: 10
 *                     start_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-01"
 *                     end_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-06-30"
 *                     status:
 *                       type: string
 *                       enum: [aktif, selesai, diberhentikan]
 *                       example: "aktif"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id_users:
 *                           type: integer
 *                           example: 10
 *                         full_name:
 *                           type: string
 *                           example: "Ahmad Zaki"
 *                         email:
 *                           type: string
 *                           example: "ahmad.zaki@example.com"
 *                         position:
 *                           type: string
 *                           example: "Backend Developer Intern"
 *                         role:
 *                           type: string
 *                           example: "intern"
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
 *                   example: "Terjadi kesalahan saat mengambil data magang"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/me', auth, internshipController.getMyInternship);

module.exports = router;
