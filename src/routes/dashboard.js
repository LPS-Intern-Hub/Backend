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
 *                     internship:
 *                       type: object
 *                       properties:
 *                         start_date:
 *                           type: string
 *                           format: date
 *                         end_date:
 *                           type: string
 *                           format: date
 *                         total_days:
 *                           type: integer
 *                         days_passed:
 *                           type: integer
 *                         progress_percentage:
 *                           type: number
 *                           format: float
 *                     attendance_this_month:
 *                       type: integer
 *                     logbook_count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', auth, dashboardController.getDashboard);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve aggregated statistics including attendance by status and logbook by status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     attendance_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           _count:
 *                             type: integer
 *                     logbook_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           _count:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', auth, dashboardController.getDashboardStats);

module.exports = router;
