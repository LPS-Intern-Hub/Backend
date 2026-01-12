// cSpell:words untuk verifikasi tidak ditemukan Silakan terlebih dahulu kadaluarsa kembali Terjadi kesalahan pada autorisasi otorisasi berdasarkan memiliki akses sudah autentikasi
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

/**
 * Middleware untuk verifikasi JWT token
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await prisma.users.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          position: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Attach user to request object
      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token sudah kadaluarsa. Silakan login kembali'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada autentikasi',
      error: error.message
    });
  }
};

/**
 * Middleware untuk otorisasi berdasarkan role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} tidak memiliki akses ke resource ini`
      });
    }
    next();
  };
};

module.exports = { auth, authorize };
