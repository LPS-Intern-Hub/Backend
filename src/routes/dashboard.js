const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard data and statistics endpoints
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard data
 *     description: Retrieve dashboard information including internship progress, monthly attendance count, and logbook summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id_users:
 *                           type: integer
 *                           example: 1
 *                         full_name:
 *                           type: string
 *                           example: "John Doe"
 *                         position:
 *                           type: string
 *                           example: "UI/UX Intern"
 *                         role:
 *                           type: string
 *                           enum: [admin, mentor, kadiv, intern]
 *                           example: "intern"
 *                     internship_progress:
 *                       type: object
 *                       properties:
 *                         start_date:
 *                           type: string
 *                           format: date
 *                           example: "2026-10-01"
 *                         end_date:
 *                           type: string
 *                           format: date
 *                           example: "2027-01-31"
 *                         total_days:
 *                           type: integer
 *                           example: 123
 *                         days_passed:
 *                           type: integer
 *                           example: 45
 *                         days_remaining:
 *                           type: integer
 *                           example: 78
 *                         percentage:
 *                           type: integer
 *                           example: 45
 *                         status:
 *                           type: string
 *                           enum: [aktif, selesai, diberhentikan]
 *                           example: "aktif"
 *                     attendance_this_month:
 *                       type: integer
 *                       example: 43
 *                     logbook_filled:
 *                       type: integer
 *                       example: 43
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', auth, dashboardController.getDashboard);

module.exports = router;

