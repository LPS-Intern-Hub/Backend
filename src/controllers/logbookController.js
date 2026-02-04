// cSpell:words Terjadi kesalahan saat mengambil tidak ditemukan harus untuk tanggal sudah berhasil disimpan sebagai dikirim atau membuat diproses dapat diubah dihapus menghapus kadiv sesuai direview Gunakan disetujui ditolak mereview statistik diperbarui memperbarui magang
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

/**
 * Get all logbooks for current user
 * GET /api/logbooks
 */
exports.getLogbooks = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const { month, year, status, page = 1, limit = 5 } = req.query;

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

    // Filter by date if provided
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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await prisma.logbooks.count({ where });

    const logbooks = await prisma.logbooks.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      skip,
      take: limitNum,
      select: {
        id_logbooks: true,
        date: true,
        activity_detail: true,
        result_output: true,
        status: true,
        approved_by: true,
        approved_at: true,
        internship: {
          select: {
            id_internships: true,
            user: {
              select: {
                id_users: true,
                full_name: true,
                email: true,
                position: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: logbooks,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
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
    const userId = req.user.id_users;

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

    const logbook = await prisma.logbooks.findFirst({
      where: {
        id_logbooks: parseInt(id),
        id_internships: internship.id_internships
      },
      include: {
        internship: {
          include: {
            user: {
              select: {
                id_users: true,
                full_name: true,
                email: true,
                position: true,
                role: true
              }
            }
          }
        },
        approver: {
          select: {
            id_users: true,
            full_name: true,
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
      data: logbook
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

    const userId = req.user.id_users;
    const { date, activity_detail, result_output, status } = req.body;

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

    // Create logbook
    const logbook = await prisma.logbooks.create({
      data: {
        id_internships: internship.id_internships,
        date: new Date(date),
        activity_detail,
        result_output,
        status: status || 'draft'
      },
      include: {
        internship: {
          include: {
            user: {
              select: {
                id_users: true,
                full_name: true,
                email: true,
                position: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Logbook berhasil disimpan sebagai ${status === 'sent' ? 'dikirim' : 'draft'}`,
      data: logbook
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
    const userId = req.user.id_users;
    const { date, activity_detail, result_output, status } = req.body;

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

    // Check if logbook exists
    const existingLogbook = await prisma.logbooks.findFirst({
      where: {
        id_logbooks: parseInt(id),
        id_internships: internship.id_internships
      }
    });

    if (!existingLogbook) {
      return res.status(404).json({
        success: false,
        message: 'Logbook tidak ditemukan'
      });
    }

    // Only allow update if status is draft or rejected
    if (!['draft', 'rejected'].includes(existingLogbook.status)) {
      return res.status(400).json({
        success: false,
        message: 'Logbook yang sudah diajukan tidak dapat diubah. Tunggu sampai ditolak untuk melakukan revisi'
      });
    }

    // Prepare update data
    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (activity_detail) updateData.activity_detail = activity_detail;
    if (result_output !== undefined) updateData.result_output = result_output;
    if (status) {
      updateData.status = status;
      // Reset approval if status changed
      if (status === 'draft' || status === 'sent') {
        updateData.approved_by = null;
        updateData.approved_at = null;
      }
    }

    const updatedLogbook = await prisma.logbooks.update({
      where: { id_logbooks: parseInt(id) },
      data: updateData,
      include: {
        internship: {
          include: {
            user: {
              select: {
                id_users: true,
                full_name: true,
                email: true,
                position: true
              }
            }
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
    const userId = req.user.id_users;

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

    // Check if logbook exists
    const logbook = await prisma.logbooks.findFirst({
      where: {
        id_logbooks: parseInt(id),
        id_internships: internship.id_internships
      }
    });

    if (!logbook) {
      return res.status(404).json({
        success: false,
        message: 'Logbook tidak ditemukan'
      });
    }

    // Only allow delete if status is draft or rejected
    if (!['draft', 'rejected'].includes(logbook.status)) {
      return res.status(400).json({
        success: false,
        message: 'Logbook yang sudah diajukan tidak dapat dihapus. Tunggu sampai ditolak untuk melakukan revisi'
      });
    }

    // Delete logbook
    await prisma.logbooks.delete({
      where: { id_logbooks: parseInt(id) }
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
 * Review logbook (for mentor/kadiv/admin)
 * PUT /api/logbooks/:id/review
 */
exports.reviewLogbook = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const reviewerId = req.user.id_users;
    const reviewerRole = req.user.role;

    // Check if logbook exists
    const logbook = await prisma.logbooks.findUnique({
      where: { id_logbooks: parseInt(id) }
    });

    if (!logbook) {
      return res.status(404).json({
        success: false,
        message: 'Logbook tidak ditemukan'
      });
    }

    // Determine new status based on current status and action
    let newStatus;

    if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'approve') {
      if (logbook.status === 'sent' && reviewerRole === 'mentor') {
        newStatus = 'review_kadiv';
      } else if (logbook.status === 'review_kadiv' && reviewerRole === 'kadiv') {
        newStatus = 'approved';
      } else if (logbook.status === 'review_mentor' && reviewerRole === 'mentor') {
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

    // Update logbook
    const updatedLogbook = await prisma.logbooks.update({
      where: { id_logbooks: parseInt(id) },
      data: {
        status: newStatus,
        approved_by: reviewerId,
        approved_at: new Date()
      },
      include: {
        internship: {
          include: {
            user: {
              select: {
                id_users: true,
                full_name: true,
                email: true,
                position: true
              }
            }
          }
        },
        approver: {
          select: {
            id_users: true,
            full_name: true,
            role: true
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
 * Submit all draft logbooks for a specific month
 * POST /api/logbooks/submit-monthly
 */
exports.submitMonthlyLogbooks = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const { month, year } = req.body;

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Bulan dan tahun harus diisi'
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Bulan harus antara 1-12'
      });
    }

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

    // Calculate date range for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    // Update all draft logbooks in the specified month to 'sent'
    const result = await prisma.logbooks.updateMany({
      where: {
        id_internships: internship.id_internships,
        status: 'draft',
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      data: {
        status: 'sent'
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada logbook draft untuk bulan tersebut'
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.count} logbook berhasil diajukan ke mentor`,
      data: {
        submitted_count: result.count,
        month: month,
        year: year
      }
    });

  } catch (error) {
    console.error('Submit monthly logbooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengajukan logbook',
      error: error.message
    });
  }
};
