// cSpell:words Terjadi kesalahan saat mengambil tidak ditemukan harus untuk tanggal sudah berhasil disimpan sebagai dikirim atau membuat diproses dapat diubah dihapus menghapus kadiv sesuai direview Gunakan disetujui ditolak mereview statistik diperbarui memperbarui
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

/**
 * Get all logbooks for current user
 * GET /api/logbooks
 */
exports.getLogbooks = async (req, res) => {
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

    const logbooks = await prisma.logbooks.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      select: {
        id: true,
        date: true,
        title: true,
        activity_detail: true,
        result_output: true,
        status: true,
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            position: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: logbooks.map(log => ({
        ...log,
        id: Number(log.id)
      }))
    });

  } catch (error) {
    console.error('Get logbooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data logbook',
      error: error.message
    });
  }
};

/**
 * Get logbook by ID
 * GET /api/logbooks/:id
 */
exports.getLogbookById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const logbook = await prisma.logbooks.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      },
      include: {
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

    if (!logbook) {
      return res.status(404).json({
        success: false,
        message: 'Logbook tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...logbook,
        id: Number(logbook.id)
      }
    });

  } catch (error) {
    console.error('Get logbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data logbook',
      error: error.message
    });
  }
};

/**
 * Create new logbook
 * POST /api/logbooks
 */
exports.createLogbook = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { date, title, activity_detail, result_output, status } = req.body;

    // Validate status
    const validStatuses = ['draft', 'sent'];
    const logbookStatus = status || 'draft';

    if (!validStatuses.includes(logbookStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus draft atau sent'
      });
    }

    // Check if logbook for this date already exists
    const existingLogbook = await prisma.logbooks.findFirst({
      where: {
        user_id: userId,
        date: new Date(date)
      }
    });

    if (existingLogbook) {
      return res.status(400).json({
        success: false,
        message: 'Logbook untuk tanggal ini sudah ada'
      });
    }

    // Create logbook
    const logbook = await prisma.logbooks.create({
      data: {
        user_id: userId,
        date: new Date(date),
        title,
        activity_detail,
        result_output,
        status: logbookStatus
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            position: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Logbook berhasil ${logbookStatus === 'draft' ? 'disimpan sebagai draft' : 'dikirim'}`,
      data: {
        ...logbook,
        id: Number(logbook.id)
      }
    });

  } catch (error) {
    console.error('Create logbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat logbook',
      error: error.message
    });
  }
};

/**
 * Update logbook
 * PUT /api/logbooks/:id
 */
exports.updateLogbook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, title, activity_detail, result_output, status } = req.body;

    // Check if logbook exists and belongs to user
    const existingLogbook = await prisma.logbooks.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!existingLogbook) {
      return res.status(404).json({
        success: false,
        message: 'Logbook tidak ditemukan'
      });
    }

    // Only allow update if status is 'draft', 'sent', or 'rejected'
    if (!['draft', 'sent', 'rejected'].includes(existingLogbook.status)) {
      return res.status(400).json({
        success: false,
        message: 'Logbook yang sudah diproses tidak dapat diubah'
      });
    }

    // Prepare update data
    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (title) updateData.title = title;
    if (activity_detail) updateData.activity_detail = activity_detail;
    if (result_output) updateData.result_output = result_output;

    // Handle status update
    if (status) {
      const validStatuses = ['draft', 'sent'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status harus draft atau sent'
        });
      }
      updateData.status = status;
    }

    // If updating from rejected, reset to sent
    if (existingLogbook.status === 'rejected' && Object.keys(updateData).length > 0) {
      updateData.status = status || 'sent';
    }

    const updatedLogbook = await prisma.logbooks.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            position: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Logbook berhasil diperbarui',
      data: updatedLogbook
    });

  } catch (error) {
    console.error('Update logbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui logbook',
      error: error.message
    });
  }
};

/**
 * Delete logbook
 * DELETE /api/logbooks/:id
 */
exports.deleteLogbook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if logbook exists and belongs to user
    const logbook = await prisma.logbooks.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!logbook) {
      return res.status(404).json({
        success: false,
        message: 'Logbook tidak ditemukan'
      });
    }

    // Only allow delete if status is 'draft', 'sent', or 'rejected'
    if (!['draft', 'sent', 'rejected'].includes(logbook.status)) {
      return res.status(400).json({
        success: false,
        message: 'Logbook yang sudah diproses tidak dapat dihapus'
      });
    }

    // Delete logbook
    await prisma.logbooks.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Logbook berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete logbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus logbook',
      error: error.message
    });
  }
};

/**
 * Review logbook (for mentor/kadiv)
 * PUT /api/logbooks/:id/review
 */
exports.reviewLogbook = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const reviewerRole = req.user.role;

    // Check if logbook exists
    const logbook = await prisma.logbooks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!logbook) {
      return res.status(404).json({
        success: false,
        message: 'Logbook tidak ditemukan'
      });
    }

    // Determine next status based on current status and reviewer role
    let newStatus;

    if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'approve') {
      if (reviewerRole === 'mentor' && logbook.status === 'sent') {
        newStatus = 'review_kadiv';
      } else if (reviewerRole === 'kadiv' && logbook.status === 'review_kadiv') {
        newStatus = 'approved';
      } else if (reviewerRole === 'mentor' && logbook.status === 'review_mentor') {
        newStatus = 'review_kadiv';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Status logbook tidak sesuai untuk direview'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action tidak valid. Gunakan "approve" atau "reject"'
      });
    }

    // Update logbook status
    const updatedLogbook = await prisma.logbooks.update({
      where: { id: parseInt(id) },
      data: { status: newStatus },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            position: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Logbook berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`,
      data: updatedLogbook
    });

  } catch (error) {
    console.error('Review logbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mereview logbook',
      error: error.message
    });
  }
};

/**
 * Get logbook statistics
 * GET /api/logbooks/stats
 */
exports.getLogbookStats = async (req, res) => {
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
    const statusCounts = await prisma.logbooks.groupBy({
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

    // Total logbooks
    const totalLogbooks = await prisma.logbooks.count({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Total filled (not draft)
    const totalFilled = await prisma.logbooks.count({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          not: 'draft'
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        month: currentMonth + 1,
        year: currentYear,
        total_logbooks: totalLogbooks,
        total_filled: totalFilled,
        by_status: statusCounts
      }
    });

  } catch (error) {
    console.error('Get logbook stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik logbook',
      error: error.message
    });
  }
};
