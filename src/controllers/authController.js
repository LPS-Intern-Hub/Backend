// cSpell:words sudah terdaftar berhasil didaftarkan Terjadi kesalahan saat mendaftarkan atau salah tidak ditemukan mengambil
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { sendErrorResponse, constantTimeDelay } = require('../utils/errorHandler');
const { sendPasswordResetEmail } = require('../utils/emailService');

/**
 * Generate JWT Token with version for revocation support
 */
const generateToken = (userId, tokenVersion) => {
  return jwt.sign(
    {
      id_users: userId,
      token_version: tokenVersion
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};



/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      // ✅ SECURITY: Add delay to prevent timing attack (equalize with bcrypt compare time)
      await constantTimeDelay(100);
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // ✅ SECURITY: Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.locked_until - new Date()) / 60000
      );
      return res.status(423).json({
        success: false,
        message: `Akun terkunci karena terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${remainingMinutes} menit.`,
        locked_until: user.locked_until
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // ✅ SECURITY: Increment failed login count
      const failedCount = user.failed_login_count + 1;
      const updateData = {
        failed_login_count: failedCount,
        last_failed_login: new Date()
      };

      // Lock account after 5 failed attempts (30 minutes lockout)
      if (failedCount >= 5) {
        updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        updateData.failed_login_count = 0; // Reset counter
      }

      await prisma.users.update({
        where: { id_users: user.id_users },
        data: updateData
      });

      const attemptsRemaining = Math.max(0, 5 - failedCount);

      return res.status(401).json({
        success: false,
        message: failedCount >= 5
          ? 'Akun terkunci selama 30 menit karena terlalu banyak percobaan login gagal.'
          : `Email atau password salah. Sisa percobaan: ${attemptsRemaining}`,
        attempts_remaining: attemptsRemaining
      });
    }

    // ✅ SECURITY: Reset failed login count on successful login
    if (user.failed_login_count > 0 || user.locked_until) {
      await prisma.users.update({
        where: { id_users: user.id_users },
        data: {
          failed_login_count: 0,
          locked_until: null,
          last_failed_login: null
        }
      });
    }

    // Generate token with current token_version
    const token = generateToken(user.id_users, user.token_version);

    // Remove password and sensitive fields from response
    const { password: _, failed_login_count, locked_until, last_failed_login, token_version, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat login', error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id_users: req.user.id_users },
      select: {
        id_users: true,
        full_name: true,
        email: true,
        role: true,
        position: true,
        bank_name: true,
        bank_account_number: true,
        bank_account_name: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil profile', error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // Increment token_version to invalidate all existing tokens
    await prisma.users.update({
      where: { id_users: req.user.id_users },
      data: {
        token_version: {
          increment: 1
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Logout berhasil'
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat logout', error);
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, link reset password telah dikirim'
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await prisma.users.update({
      where: { id_users: user.id_users },
      data: {
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires
      }
    });

    // Send email
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({
      success: true,
      message: 'Jika email terdaftar, link reset password telah dikirim'
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat memproses permintaan', error);
  }
};

/**
 * Verify reset token
 * GET /api/auth/verify-reset-token/:token
 */
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.users.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid atau sudah kadaluarsa'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token valid'
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat memverifikasi token', error);
  }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Find user with valid token
    const user = await prisma.users.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid atau sudah kadaluarsa'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.users.update({
      where: { id_users: user.id_users },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        // Increment token_version to invalidate all existing JWT tokens
        token_version: {
          increment: 1
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru'
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mereset password', error);
  }
};

/**
 * Change password (authenticated user)
 * PUT /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.users.findUnique({
      where: { id_users: req.user.id_users }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password lama tidak sesuai' });
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id_users: req.user.id_users },
      data: {
        password: hashedPassword,
        token_version: { increment: 1 }
      }
    });

    res.status(200).json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengubah password', error);
  }
};

/**
 * Update bank info
 * PUT /api/auth/update-profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { bank_name, bank_account_number, bank_account_name } = req.body;

    const updatedUser = await prisma.users.update({
      where: { id_users: req.user.id_users },
      data: {
        bank_name: bank_name || null,
        bank_account_number: bank_account_number || null,
        bank_account_name: bank_account_name || null
      },
      select: {
        id_users: true,
        full_name: true,
        email: true,
        role: true,
        position: true,
        bank_name: true,
        bank_account_number: true,
        bank_account_name: true,
        updated_at: true
      }
    });

    res.status(200).json({ success: true, message: 'Profil berhasil diperbarui', data: updatedUser });
  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat memperbarui profil', error);
  }
};