// cSpell:words Terjadi kesalahan saat mengambil statistik
const prisma = require('../utils/prisma');

/**
 * Get dashboard data for current user
 * GET /api/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get internship data
    const internship = await prisma.internships.findUnique({
      where: { user_id: userId }
    });

    // Calculate internship progress
    let progressData = {
      start_date: null,
      end_date: null,
      total_days: 0,
      days_passed: 0,
      days_remaining: 0,
      percentage: 0,
      status: null
    };

    if (internship) {
      const startDate = new Date(internship.start_date);
      const endDate = new Date(internship.end_date);
      const today = new Date();
      
      // Set time to midnight for accurate day calculation
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      // Calculate total days
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate days passed (only if internship has started)
      let daysPassed = 0;
      if (today >= startDate) {
        daysPassed = Math.min(
          Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1,
          totalDays
        );
      }
      
      // Calculate days remaining
      const daysRemaining = Math.max(totalDays - daysPassed, 0);
      
      // Calculate percentage
      const percentage = totalDays > 0 ? Math.round((daysPassed / totalDays) * 100) : 0;

      progressData = {
        start_date: internship.start_date,
        end_date: internship.end_date,
        total_days: totalDays,
        days_passed: daysPassed,
        days_remaining: daysRemaining,
        percentage: percentage,
        status: internship.status
      };
    }

    // Get attendance count for current month
    const attendanceCount = await prisma.presences.count({
      where: {
        user_id: userId,
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: new Date(currentYear, currentMonth + 1, 0)
        },
        status: {
          in: ['present', 'permission', 'sick']
        }
      }
    });

    // Get logbook count for current month
    const logbookCount = await prisma.logbooks.count({
      where: {
        user_id: userId,
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: new Date(currentYear, currentMonth + 1, 0)
        },
        status: {
          not: 'draft'
        }
      }
    });

    // Get recent presences (last 5)
    const recentPresences = await prisma.presences.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        date: 'desc'
      },
      take: 5,
      select: {
        id: true,
        date: true,
        check_in: true,
        check_out: true,
        status: true,
        location: true
      }
    });

    // Get recent logbooks (last 5)
    const recentLogbooks = await prisma.logbooks.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        date: 'desc'
      },
      take: 5,
      select: {
        id: true,
        date: true,
        title: true,
        status: true
      }
    });

    // Convert BigInt to Number for JSON serialization
    const formatPresences = recentPresences.map(p => ({
      ...p,
      id: Number(p.id)
    }));

    const formatLogbooks = recentLogbooks.map(l => ({
      ...l,
      id: Number(l.id)
    }));

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          full_name: req.user.full_name,
          position: req.user.position,
          role: req.user.role
        },
        internship_progress: progressData,
        attendance_this_month: attendanceCount,
        logbook_filled: logbookCount,
        recent_presences: formatPresences,
        recent_logbooks: formatLogbooks
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data dashboard',
      error: error.message
    });
  }
};

/**
 * Get dashboard statistics summary
 * GET /api/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total presences
    const totalPresences = await prisma.presences.count({
      where: { user_id: userId }
    });

    // Get total logbooks
    const totalLogbooks = await prisma.logbooks.count({
      where: { user_id: userId }
    });

    // Get total permissions
    const totalPermissions = await prisma.permissions.count({
      where: { user_id: userId }
    });

    // Get presence by status
    const presenceByStatus = await prisma.presences.groupBy({
      by: ['status'],
      where: { user_id: userId },
      _count: {
        status: true
      }
    });

    // Get logbook by status
    const logbookByStatus = await prisma.logbooks.groupBy({
      by: ['status'],
      where: { user_id: userId },
      _count: {
        status: true
      }
    });

    // Get permission by status
    const permissionByStatus = await prisma.permissions.groupBy({
      by: ['status'],
      where: { user_id: userId },
      _count: {
        status: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total_presences: totalPresences,
        total_logbooks: totalLogbooks,
        total_permissions: totalPermissions,
        presence_by_status: presenceByStatus,
        logbook_by_status: logbookByStatus,
        permission_by_status: permissionByStatus
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik dashboard',
      error: error.message
    });
  }
};
