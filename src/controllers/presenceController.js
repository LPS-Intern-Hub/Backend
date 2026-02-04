// cSpell:words Absen Masuk Anda sudah melakukan absen masuk hari sakit Foto Terjadi kesalahan saat mengambil wajah harus diupload berhasil pulang belum presensi tidak ditemukan statistik magang terlalu jauh dari kantor
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check-in (Absen Masuk)
 * POST /api/presences/check-in
 */
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const { latitude, longitude, location } = req.body;

    // Validate location - Check if within office radius
    const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
    const officeLon = parseFloat(process.env.OFFICE_LONGITUDE);
    const officeRadius = parseFloat(process.env.OFFICE_RADIUS_METERS || 200);
    
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      officeLat,
      officeLon
    );

    if (distance > officeRadius) {
      return res.status(400).json({
        success: false,
        message: `Anda terlalu jauh dari kantor. Jarak: ${Math.round(distance)}m (maksimal: ${officeRadius}m)`,
        data: {
          distance: Math.round(distance),
          maxRadius: officeRadius,
          officeName: process.env.OFFICE_NAME
        }
      });
    }

    // Get internship first
    const internship = await prisma.internships.findFirst({
      where: { id_users: userId, status: 'aktif' }
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Data magang aktif tidak ditemukan'
      });
    }

    // Use UTC date for consistency
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Check if already checked in today
    const existingPresence = await prisma.presensi.findFirst({
      where: {
        id_internships: internship.id_internships,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Less than tomorrow
        }
      }
    });

    if (existingPresence && existingPresence.check_in) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah melakukan absen masuk hari ini'
      });
    }

    const currentTime = new Date();
    // Create a DateTime object for check_in time
    const checkInTime = new Date();
    checkInTime.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), 0);

    // Handle uploaded image - Upload to S3
    let imageUrl = null;
    if (req.file) {
      const fileName = `presences/${Date.now()}-${userId}-${req.file.originalname}`;
      const s3Result = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);
      imageUrl = s3Result.Location; // URL S3
    }

    // Determine status (simple logic: late if after 08:30)
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const isLate = hour > 8 || (hour === 8 && minute >= 30);
    
    console.log('Check-in debug:', { hour, minute, isLate, currentTime: currentTime.toISOString() });

    const presenceData = existingPresence
      ? await prisma.presensi.update({
        where: { id_presensi: existingPresence.id_presensi },
        data: {
          check_in: checkInTime,
          checkin_latitude: parseFloat(latitude),
          checkin_longitude: parseFloat(longitude),
          checkin_location: location,
          checkin_image_url: imageUrl || existingPresence.checkin_image_url,
          status: isLate ? 'terlambat' : 'hadir'
        }
      })
      : await prisma.presensi.create({
        data: {
          id_internships: internship.id_internships,
          date: today,
          check_in: checkInTime,
          checkin_latitude: parseFloat(latitude),
          checkin_longitude: parseFloat(longitude),
          checkin_location: location,
          checkin_image_url: imageUrl,
          status: isLate ? 'terlambat' : 'hadir'
        }
      });

    res.status(200).json({
      success: true,
      message: 'Absen masuk berhasil',
      data: presenceData
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat absen masuk',
      error: error.message
    });
  }
};

/**
 * Check-out (Absen Pulang)
 * POST /api/presences/check-out
 */
exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const { latitude, longitude, location } = req.body;

    // Validate location - Check if within office radius
    const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
    const officeLon = parseFloat(process.env.OFFICE_LONGITUDE);
    const officeRadius = parseFloat(process.env.OFFICE_RADIUS_METERS || 200);
    
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      officeLat,
      officeLon
    );

    if (distance > officeRadius) {
      return res.status(400).json({
        success: false,
        message: `Anda terlalu jauh dari kantor. Jarak: ${Math.round(distance)}m (maksimal: ${officeRadius}m)`,
        data: {
          distance: Math.round(distance),
          maxRadius: officeRadius,
          officeName: process.env.OFFICE_NAME
        }
      });
    }

    // Get internship first
    const internship = await prisma.internships.findFirst({
      where: { id_users: userId, status: 'aktif' }
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Data magang aktif tidak ditemukan'
      });
    }

    // Use UTC date for consistency
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    console.log('Check-out debug - today:', today, 'internship:', internship.id_internships);

    // Check if presence exists
    const presence = await prisma.presensi.findFirst({
      where: {
        id_internships: internship.id_internships,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Less than tomorrow
        }
      }
    });

    console.log('Check-out debug - presence found:', presence);

    if (!presence) {
      return res.status(404).json({
        success: false,
        message: 'Anda belum melakukan absen masuk hari ini'
      });
    }

    if (!presence.check_in) {
      return res.status(400).json({
        success: false,
        message: 'Anda belum melakukan absen masuk hari ini'
      });
    }

    if (presence.check_out) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah melakukan absen pulang hari ini'
      });
    }

    const currentTime = new Date();
    // Create a DateTime object for check_out time
    const checkOutTime = new Date();
    checkOutTime.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), 0);

    // Handle uploaded image for check-out - Upload to S3
    let checkOutImageUrl = null;
    if (req.file) {
      const fileName = `presences/checkout-${Date.now()}-${userId}-${req.file.originalname}`;
      const s3Result = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);
      checkOutImageUrl = s3Result.Location; // URL S3
    }

    const updatedPresence = await prisma.presensi.update({
      where: { id_presensi: presence.id_presensi },
      data: {
        check_out: checkOutTime,
        checkout_latitude: latitude ? parseFloat(latitude) : null,
        checkout_longitude: longitude ? parseFloat(longitude) : null,
        checkout_location: location || null,
        checkout_image_url: checkOutImageUrl
      }
    });

    res.status(200).json({
      success: true,
      message: 'Absen pulang berhasil',
      data: updatedPresence
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat absen pulang',
      error: error.message
    });
  }
};

/**
 * Get today's presence
 * GET /api/presences/today
 */
exports.getTodayPresence = async (req, res) => {
  try {
    const userId = req.user.id_users;

    // Get internship first
    const internship = await prisma.internships.findFirst({
      where: { id_users: userId, status: 'aktif' }
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Data magang aktif tidak ditemukan'
      });
    }

    // Use UTC date for consistency
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const presence = await prisma.presensi.findFirst({
      where: {
        id_internships: internship.id_internships,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Less than tomorrow
        }
      }
    });

    res.status(200).json({
      success: true,
      data: presence
    });

  } catch (error) {
    console.error('Get today presence error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data presensi',
      error: error.message
    });
  }
};

/**
 * Get all presences for current user
 * GET /api/presences
 */
exports.getPresences = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const { month, year, status } = req.query;

    // Get internship first
    const internship = await prisma.internships.findFirst({
      where: { id_users: userId }
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Data magang tidak ditemukan'
      });
    }

    const where = { id_internships: internship.id_internships };

    // Filter by date range if month and year provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    if (status) {
      where.status = status;
    }

    // Pagination setup
    const { page = 1, limit = 5 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await prisma.presensi.count({ where });

    const presences = await prisma.presensi.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      skip,
      take: limitNum,
      select: {
        id_presensi: true,
        date: true,
        check_in: true,
        check_out: true,
        checkin_latitude: true,
        checkin_longitude: true,
        checkin_location: true,
        checkin_image_url: true,
        checkout_latitude: true,
        checkout_longitude: true,
        checkout_location: true,
        checkout_image_url: true,
        status: true
      }
    });

    res.status(200).json({
      success: true,
      data: presences,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get presences error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data presensi',
      error: error.message
    });
  }
};

