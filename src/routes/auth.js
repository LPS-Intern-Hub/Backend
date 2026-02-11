// cSpell:words lengkap harus diisi karakter diizinkan tidak Posisi kadiv
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */



/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password, returns user data and JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: intern1@simagang.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login berhasil"
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
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "intern1@simagang.com"
 *                         role:
 *                           type: string
 *                           enum: [intern, mentor, kadiv, admin]
 *                           example: "intern"
 *                         position:
 *                           type: string
 *                           example: "Backend Developer"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-01T00:00:00.000Z"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-01T00:00:00.000Z"
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VycyI6MSwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.abc123def456"
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
 *                         example: "Email harus diisi"
 *                       param:
 *                         type: string
 *                         example: "email"
 *                       location:
 *                         type: string
 *                         example: "body"
 *       401:
 *         description: Invalid credentials
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
 *                   example: "Email atau password salah"
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
 *                   example: "Terjadi kesalahan saat login"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.post(
  '/login',
  loginLimiter, // Rate limiting: 5 attempts per 15 minutes
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email harus diisi')
      .isEmail()
      .withMessage('Format email tidak valid')
      .normalizeEmail()
      .escape(), // ✅ SECURITY: XSS protection
    body('password')
      .notEmpty()
      .withMessage('Password harus diisi')
      .trim()
  ],
  authController.login
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     id_users:
 *                       type: integer
 *                       example: 1
 *                     full_name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "intern1@simagang.com"
 *                     role:
 *                       type: string
 *                       enum: [intern, mentor, kadiv, admin]
 *                       example: "intern"
 *                     position:
 *                       type: string
 *                       example: "Backend Developer"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-01T00:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-01T00:00:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 *                   example: "Token tidak valid atau tidak ditemukan"
 *       404:
 *         description: User not found
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
 *                   example: "User tidak ditemukan"
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
 *                   example: "Terjadi kesalahan saat mengambil profile"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get('/me', auth, authController.getProfile);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revoke current JWT token and logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: "Logout berhasil"
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', auth, authController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email to user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: intern1@simagang.com
 *     responses:
 *       200:
 *         description: Reset email sent (always returns success to prevent email enumeration)
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
 *                   example: "Jika email terdaftar, link reset password telah dikirim"
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email harus diisi')
      .isEmail()
      .withMessage('Format email tidak valid')
      .normalizeEmail()
      .escape()
  ],
  authController.requestPasswordReset
);

/**
 * @swagger
 * /auth/verify-reset-token/{token}:
 *   get:
 *     summary: Verify reset token
 *     description: Check if password reset token is valid and not expired
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                   example: "Token valid"
 *       400:
 *         description: Invalid or expired token
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
 *                   example: "Token tidak valid atau sudah kadaluarsa"
 *       500:
 *         description: Server error
 */
router.get('/verify-reset-token/:token', authController.verifyResetToken);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset user password with valid token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: "a1b2c3d4e5f6..."
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                   example: "Password berhasil direset. Silakan login dengan password baru"
 *       400:
 *         description: Invalid token or validation error
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
 *                   example: "Token tidak valid atau sudah kadaluarsa"
 *       500:
 *         description: Server error
 */
router.post(
  '/reset-password',
  [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Token harus diisi'),
    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('Password baru harus diisi')
      .isLength({ min: 6 })
      .withMessage('Password minimal 6 karakter')
  ],
  authController.resetPassword
);

// Change password (authenticated)
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword')
      .trim()
      .notEmpty()
      .withMessage('Password lama harus diisi'),
    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('Password baru harus diisi')
      .isLength({ min: 6 })
      .withMessage('Password baru minimal 6 karakter')
  ],
  authController.changePassword
);

// Update profile (bank info)
router.put(
  '/update-profile',
  auth,
  [
    body('bank_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Nama bank maksimal 100 karakter'),
    body('bank_account_number')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Nomor rekening maksimal 50 karakter'),
    body('bank_account_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Nama pemilik rekening maksimal 100 karakter')
  ],
  authController.updateProfile
);

module.exports = router;