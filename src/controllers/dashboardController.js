// cSpell:words Terjadi kesalahan saat mengambil statistik
const prisma = require('../utils/prisma');

/**
 * Get dashboard data for current user
 * GET /api/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get internship data
    const internship = await prisma.internships.findFirst({
      where: { id_users: userId }
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

    let internshipId = null;

    if (internship) {
      internshipId = internship.id_internships;
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

    // Get attendance count for current month (if internship exists)
    const attendanceCount = internshipId ? await prisma.presensi.count({
      where: {
        id_internships: internshipId,
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: new Date(currentYear, currentMonth + 1, 0)
        },
        status: {
          in: ['hadir', 'izin', 'terlambat']
        }
      }
    }) : 0;

    // Get logbook count for current month (if internship exists)
    const logbookCount = internshipId ? await prisma.logbooks.count({
      where: {
        id_internships: internshipId,
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: new Date(currentYear, currentMonth + 1, 0)
        },
        status: {
          not: 'draft'
        }
      }
    }) : 0;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id_users: req.user.id_users,
          full_name: req.user.full_name,
          position: req.user.position,
          role: req.user.role
        },
        internship_progress: progressData,
        attendance_this_month: attendanceCount,
        logbook_filled: logbookCount
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


