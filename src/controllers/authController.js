// cSpell:words sudah terdaftar berhasil didaftarkan Terjadi kesalahan saat mendaftarkan atau salah tidak ditemukan mengambil
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id_users: userId },
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

    // Generate token
    const token = generateToken(user.id_users);

    // Remove password from response
    const { password: _, failed_login_count, locked_until, last_failed_login, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login',
      error: error.message
    });
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profile',
      error: error.message
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const redisClient = require('../utils/redis');
    const token = req.headers.authorization?.substring(7);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }

    // Decode token to get expiry time
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid'
      });
    }

    // Calculate remaining time until token expires
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    if (expiresIn > 0) {
      try {
        // Add token to blacklist in Redis
        if (redisClient.isReady) {
          await redisClient.setEx(
            `blacklist:${token}`,
            expiresIn,
            'revoked'
          );
        } else {
          console.warn('⚠️  Redis not available. Token revocation skipped.');
        }
      } catch (error) {
        console.error('Redis error during logout:', error);
        // Continue with logout even if Redis fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logout berhasil'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat logout',
      error: error.message
    });
  }
};

