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
 *     description: Record check-in with photo, location, and coordinates
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
 *               - latitude
 *               - longitude
 *               - location
 *               - image
 *             properties:
 *               latitude:
 *                 type: number
 *                 format: double
 *                 description: Latitude coordinate
 *                 example: -6.200000
 *               longitude:
 *                 type: number
 *                 format: double
 *                 description: Longitude coordinate
 *                 example: 106.816666
 *               location:
 *                 type: string
 *                 maxLength: 255
 *                 description: Check-in location name
 *                 example: "Kantor Pusat, Jakarta Selatan"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Photo for check-in (JPG/PNG - max 5MB)
 *     responses:
 *       200:
 *         description: Check-in successful
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
 *                   example: "Absen masuk berhasil"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_presensi:
 *                       type: integer
 *                       example: 123
 *                     id_internships:
 *                       type: integer
 *                       example: 1
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-27"
 *                     check_in:
 *                       type: string
 *                       example: "08:15:30"
 *                     check_out:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     latitude:
 *                       type: number
 *                       format: double
 *                       example: -6.200000
 *                     longitude:
 *                       type: number
 *                       format: double
 *                       example: 106.816666
 *                     location:
 *                       type: string
 *                       example: "Kantor Pusat, Jakarta Selatan"
 *                     image_url:
 *                       type: string
 *                       example: "/uploads/presences/1706345730000-photo.jpg"
 *                     status:
 *                       type: string
 *                       enum: [hadir, terlambat]
 *                       example: "hadir"
 *       400:
 *         description: Already checked in today or validation error
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
 *                   example: "Anda sudah melakukan absen masuk hari ini"
 *       404:
 *         description: Active internship not found
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
 *                   example: "Data magang aktif tidak ditemukan"
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
 *                   example: "Terjadi kesalahan saat absen masuk"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.post(
  '/check-in',
  auth,
  uploadPresence.single('image'),
  [
    body('latitude')
      .notEmpty()
      .withMessage('Latitude harus diisi')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude harus berupa angka antara -90 sampai 90'),
    body('longitude')
      .notEmpty()
      .withMessage('Longitude harus diisi')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude harus berupa angka antara -180 sampai 180'),
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
 * @swagger
 * /presences/check-out:
 *   post:
 *     summary: Check-out attendance
 *     description: Record check-out time for today's attendance
 *     tags: [Presences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-out successful
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
 *                   example: "Absen pulang berhasil"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_presensi:
 *                       type: integer
 *                       example: 123
 *                     id_internships:
 *                       type: integer
 *                       example: 1
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-27"
 *                     check_in:
 *                       type: string
 *                       example: "08:15:30"
 *                     check_out:
 *                       type: string
 *                       example: "17:00:45"
 *                     latitude:
 *                       type: number
 *                       example: -6.200000
 *                     longitude:
 *                       type: number
 *                       example: 106.816666
 *                     location:
 *                       type: string
 *                       example: "Kantor Pusat, Jakarta Selatan"
 *                     image_url:
 *                       type: string
 *                       example: "/uploads/presences/1706345730000-photo.jpg"
 *                     status:
 *                       type: string
 *                       example: "hadir"
 *       400:
 *         description: Already checked out today
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
 *                   example: "Anda sudah melakukan absen pulang hari ini"
 *       404:
 *         description: Haven't checked in today or internship not found
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
 *                   example: "Anda belum melakukan absen masuk hari ini"
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
 *                   example: "Terjadi kesalahan saat absen pulang"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.post(
  '/check-out',
  auth,
  presenceController.checkOut
);

/**
 * @swagger
 * /presences/today:
 *   get:
 *     summary: Get today's presence
 *     description: Retrieve attendance record for current date
 *     tags: [Presences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's presence data (can be null if no presence today)
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
 *                   nullable: true
 *                   properties:
 *                     id_presensi:
 *                       type: integer
 *                       example: 123
 *                     id_internships:
 *                       type: integer
 *                       example: 1
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-29"
 *                     check_in:
 *                       type: string
 *                       example: "08:15:30"
 *                     check_out:
 *                       type: string
 *                       nullable: true
 *                       example: "17:00:45"
 *                     latitude:
 *                       type: number
 *                       format: double
 *                       example: -6.200000
 *                     longitude:
 *                       type: number
 *                       format: double
 *                       example: 106.816666
 *                     location:
 *                       type: string
 *                       example: "Kantor Pusat, Jakarta Selatan"
 *                     image_url:
 *                       type: string
 *                       nullable: true
 *                       example: "/uploads/presences/1706345730000-photo.jpg"
 *                     status:
 *                       type: string
 *                       enum: [hadir, izin, alfa, terlambat]
 *                       example: "hadir"
 *       404:
 *         description: Active internship not found
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
 *                   example: "Data magang aktif tidak ditemukan"
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
 *                   example: "Terjadi kesalahan saat mengambil data presensi"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/today', auth, presenceController.getTodayPresence);

/**
 * @swagger
 * /presences:
 *   get:
 *     summary: Get all presences
 *     description: Retrieve all attendance records for current user with optional filters
 *     tags: [Presences]
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
 *           enum: [hadir, izin, alfa, terlambat]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of presences
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
 *                       id_presensi:
 *                         type: integer
 *                         example: 123
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2026-01-29"
 *                       check_in:
 *                         type: string
 *                         example: "08:15:30"
 *                       check_out:
 *                         type: string
 *                         nullable: true
 *                         example: "17:00:45"
 *                       latitude:
 *                         type: number
 *                         format: double
 *                         example: -6.200000
 *                       longitude:
 *                         type: number
 *                         format: double
 *                         example: 106.816666
 *                       location:
 *                         type: string
 *                         example: "Kantor Pusat, Jakarta Selatan"
 *                       image_url:
 *                         type: string
 *                         nullable: true
 *                         example: "/uploads/presences/1706345730000-photo.jpg"
 *                       status:
 *                         type: string
 *                         enum: [hadir, izin, alfa, terlambat]
 *                         example: "hadir"
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
 *                   example: "Terjadi kesalahan saat mengambil data presensi"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/', auth, presenceController.getPresences);

module.exports = router;


