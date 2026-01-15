// cSpell:words Absen Masuk Anda sudah melakukan absen masuk hari sakit Foto Terjadi kesalahan saat mengambil wajah harus diupload berhasil pulang belum presensi tidak ditemukan statistik
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
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { location } = req.body;
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];

    // Check if already checked in today - get latest presence
    const latestPresence = await prisma.presences.findFirst({
      where: {
        user_id: userId
      },
      orderBy: {
        date: 'desc'
      }
    });

    let existingPresence = null;
    if (latestPresence) {
      const latestDateString = new Date(latestPresence.date).toISOString().split('T')[0];
      if (latestDateString === todayString) {
        existingPresence = latestPresence;
      }
    }

    if (existingPresence && existingPresence.check_in) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Anda sudah melakukan absen masuk hari ini'
      });
    }

    // Create date object for today in local timezone
    const todayDate = new Date(todayString + 'T00:00:00');

    // Check if user has permission for today
    const permission = await prisma.permissions.findFirst({
      where: {
        user_id: userId,
        status: 'approved',
        start_date: {
          lte: todayDate
        },
        end_date: {
          gte: todayDate
        }
      }
    });

    // Determine status
    let status = 'present';
    let permissionId = null;

    if (permission) {
      status = permission.type === 'sakit' ? 'sick' : 'permission';
      permissionId = permission.id;
    }

    // Image is required
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Foto wajah harus diupload'
      });
    }

    const imageUrl = `/uploads/presences/${req.file.filename}`;
    const currentTime = new Date();

    // Create or update presence
    let presence;
    if (existingPresence) {
      presence = await prisma.presences.update({
        where: { id: existingPresence.id },
        data: {
          check_in: currentTime,
          location,
          image_url: imageUrl,
          status,
          permission_id: permissionId
        }
      });
    } else {
      presence = await prisma.presences.create({
        data: {
          user_id: userId,
          date: todayDate,
          check_in: currentTime,
          location,
          image_url: imageUrl,
          status,
          permission_id: permissionId
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Absen masuk berhasil',
      data: {
        ...presence,
        id: Number(presence.id),
        permission_id: presence.permission_id ? Number(presence.permission_id) : null
      }
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
    const userId = req.user.id;
    
    // Get today's date string in YYYY-MM-DD format (local timezone)
    const now = new Date();
    const todayString = now.toISOString().split('T')[0]; // "2026-01-15"

    console.log('=== CHECK OUT DEBUG ===');
    console.log('User ID:', userId);
    console.log('Current time:', now);
    console.log('Today string:', todayString);

    // Find today's presence - search by user and order by date desc, take first
    const presence = await prisma.presences.findFirst({
      where: {
        user_id: userId
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log('Found latest presence:', presence);

    if (!presence) {
      console.log('ERROR: No presence found');
      return res.status(400).json({
        success: false,
        message: 'Anda belum melakukan absen masuk hari ini'
      });
    }

    // Check if presence is from today by comparing date strings
    const presenceDate = new Date(presence.date);
    const presenceDateString = presenceDate.toISOString().split('T')[0];
    
    console.log('Presence date:', presenceDate);
    console.log('Presence date string:', presenceDateString);
    console.log('Dates match:', presenceDateString === todayString);

    if (presenceDateString !== todayString) {
      console.log('ERROR: Latest presence is not from today');
      return res.status(400).json({
        success: false,
        message: 'Anda belum melakukan absen masuk hari ini'
      });
    }

    if (!presence.check_in) {
      console.log('ERROR: check_in is null');
      return res.status(400).json({
        success: false,
        message: 'Anda belum melakukan absen masuk hari ini'
      });
    }

    if (presence.check_out) {
      console.log('ERROR: Already checked out at', presence.check_out);
      return res.status(400).json({
        success: false,
        message: 'Anda sudah melakukan absen pulang hari ini'
      });
    }

    const currentTime = new Date();
    console.log('Updating check_out to:', currentTime);

    // Update check-out time
    const updatedPresence = await prisma.presences.update({
      where: { id: presence.id },
      data: {
        check_out: currentTime
      }
    });

    console.log('Updated successfully:', updatedPresence);

    res.status(200).json({
      success: true,
      message: 'Absen pulang berhasil',
      data: {
        ...updatedPresence,
        id: Number(updatedPresence.id),
        permission_id: updatedPresence.permission_id ? Number(updatedPresence.permission_id) : null
      }
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
    const userId = req.user.id;
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];

    // Get latest presence and check if it's from today
    const latestPresence = await prisma.presences.findFirst({
      where: {
        user_id: userId
      },
      orderBy: {
        date: 'desc'
      },
      include: {
        permission: {
          select: {
            id: true,
            type: true,
            title: true,
            status: true
          }
        }
      }
    });

    let presence = null;
    if (latestPresence) {
      const latestDateString = new Date(latestPresence.date).toISOString().split('T')[0];
      if (latestDateString === todayString) {
        presence = latestPresence;
      }
    }

    res.status(200).json({
      success: true,
      data: presence ? {
        ...presence,
        id: Number(presence.id),
        permission_id: presence.permission_id ? Number(presence.permission_id) : null,
        permission: presence.permission ? {
          ...presence.permission,
          id: Number(presence.permission.id)
        } : null
      } : null
    });

  } catch (error) {
    console.error('Get today presence error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data presensi hari ini',
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
    const userId = req.user.id;
    const { status, month, year } = req.query;

    // Build filter
    const where = { user_id: userId };

    if (status) {
      where.status = status;
    }

    // Filter by month and year
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);

      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const presences = await prisma.presences.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      include: {
        permission: {
          select: {
            id: true,
            type: true,
            title: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            full_name: true,
            position: true
          }
        }
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

/**
 * Get presence by ID
 * GET /api/presences/:id
 */
exports.getPresenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const presence = await prisma.presences.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      },
      include: {
        permission: {
          select: {
            id: true,
            type: true,
            title: true,
            reason: true,
            status: true,
            start_date: true,
            end_date: true
          }
        },
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            position: true,
            role: true
          }
        }
      }
    });

    if (!presence) {
      return res.status(404).json({
        success: false,
        message: 'Data presensi tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: presence
    });

  } catch (error) {
    console.error('Get presence error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data presensi',
      error: error.message
    });
  }
};

/**
 * Get presence statistics
 * GET /api/presences/stats
 */
exports.getPresenceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const currentDate = new Date();
    const currentMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const currentYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // Count by status
    const statusCounts = await prisma.presences.groupBy({
      by: ['status'],
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        status: true
      }
    });

    // Total presences
    const totalPresences = await prisma.presences.count({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate alpha (expected days - total presences)
    const today = new Date();
    const daysInMonth = endDate.getDate();
    const currentDay = currentYear === today.getFullYear() && currentMonth === today.getMonth()
      ? today.getDate()
      : daysInMonth;

    const expectedDays = currentDay;
    const alpha = Math.max(0, expectedDays - totalPresences);

    res.status(200).json({
      success: true,
      data: {
        month: currentMonth + 1,
        year: currentYear,
        total_presences: totalPresences,
        expected_days: expectedDays,
        alpha: alpha,
        by_status: statusCounts
      }
    });

  } catch (error) {
    console.error('Get presence stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik presensi',
      error: error.message
    });
  }
};
