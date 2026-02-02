// cSpell:words Absen Masuk Anda sudah melakukan absen masuk hari sakit Foto Terjadi kesalahan saat mengambil wajah harus diupload berhasil pulang belum presensi tidak ditemukan statistik magang
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

/**
 * Check-in (Absen Masuk)
 * POST /api/presences/check-in
 */
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const { latitude, longitude, location } = req.body;

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingPresence = await prisma.presensi.findFirst({
      where: {
        id_internships: internship.id_internships,
        date: today
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

    // Handle uploaded image
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/presences/${req.file.filename}`;
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
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          location,
          image_url: imageUrl || existingPresence.image_url,
          status: isLate ? 'terlambat' : 'hadir'
        }
      })
      : await prisma.presensi.create({
        data: {
          id_internships: internship.id_internships,
          date: today,
          check_in: checkInTime,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          location,
          image_url: imageUrl,
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
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if presence exists
    const presence = await prisma.presensi.findFirst({
      where: {
        id_internships: internship.id_internships,
        date: today
      }
    });

    if (!presence) {
      return res.status(404).json({
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

    const updatedPresence = await prisma.presensi.update({
      where: { id_presensi: presence.id_presensi },
      data: {
        check_out: checkOutTime
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const presence = await prisma.presensi.findFirst({
      where: {
        id_internships: internship.id_internships,
        date: today
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

    const presences = await prisma.presensi.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      select: {
        id_presensi: true,
        date: true,
        check_in: true,
        check_out: true,
        latitude: true,
        longitude: true,
        location: true,
        image_url: true,
        status: true
      }
    });

    res.status(200).json({
      success: true,
      data: presences
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

