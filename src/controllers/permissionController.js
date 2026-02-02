// cSpell:words Terjadi kesalahan saat mengambil perizinan Perizinan tidak ditemukan Tanggal selesai boleh lebih awal dari tanggal mulai berhasil diajukan mengajukan sudah diproses dapat diubah diperbarui memperbarui dihapus menghapus kadiv sesuai untuk direview Gunakan atau disetujui ditolak mereview magang
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

/**
 * Get all permissions for current user
 * GET /api/permissions
 */
exports.getPermissions = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const { status, type } = req.query;

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

    // Build filter
    const where = { id_internships: internship.id_internships };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const permissions = await prisma.permissions.findMany({
      where,
      orderBy: {
        id_permissions: 'desc'
      },
      select: {
        id_permissions: true,
        type: true,
        title: true,
        reason: true,
        start_date: true,
        end_date: true,
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

    // Calculate duration for each permission
    const permissionsWithDuration = permissions.map(permission => {
      const startDate = new Date(permission.start_date);
      const endDate = new Date(permission.end_date);
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      return {
        ...permission,
        duration_days: durationDays
      };
    });

    res.status(200).json({
      success: true,
      data: permissionsWithDuration
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data perizinan',
      error: error.message
    });
  }
};

/**
 * Get permission by ID
 * GET /api/permissions/:id
 */
exports.getPermissionById = async (req, res) => {
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

    const permission = await prisma.permissions.findFirst({
      where: {
        id_permissions: parseInt(id),
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

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Perizinan tidak ditemukan'
      });
    }

    // Calculate duration
    const startDate = new Date(permission.start_date);
    const endDate = new Date(permission.end_date);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    res.status(200).json({
      success: true,
      data: {
        ...permission,
        duration_days: durationDays
      }
    });

  } catch (error) {
    console.error('Get permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data perizinan',
      error: error.message
    });
  }
};

/**
 * Create new permission
 * POST /api/permissions
 */
exports.createPermission = async (req, res) => {
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
    const { type, reason, start_date, end_date } = req.body;

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

    // Check date validity
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
      });
    }

    // Auto-generate title from type
    const title = type === 'sakit' ? 'Izin Sakit' : 'Izin';

    // Create permission
    const permission = await prisma.permissions.create({
      data: {
        id_internships: internship.id_internships,
        type,
        title,
        reason,
        start_date: startDate,
        end_date: endDate,
        status: 'pending'
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
      message: 'Perizinan berhasil diajukan',
      data: permission
    });

  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengajukan perizinan',
      error: error.message
    });
  }
};

/**
 * Update permission
 * PUT /api/permissions/:id
 */
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id_users;
    const { type, title, reason, start_date, end_date } = req.body;

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

    // Check if permission exists and belongs to user
    const existingPermission = await prisma.permissions.findFirst({
      where: {
        id_permissions: parseInt(id),
        id_internships: internship.id_internships
      }
    });

    if (!existingPermission) {
      return res.status(404).json({
        success: false,
        message: 'Perizinan tidak ditemukan'
      });
    }

    // Only allow update if status is 'pending' or 'rejected'
    if (!['pending', 'rejected'].includes(existingPermission.status)) {
      return res.status(400).json({
        success: false,
        message: 'Perizinan yang sudah diproses tidak dapat diubah'
      });
    }

    // Prepare update data
    const updateData = {};
    if (type) updateData.type = type;
    if (title) updateData.title = title;
    if (reason) updateData.reason = reason;
    if (start_date) updateData.start_date = new Date(start_date);
    if (end_date) updateData.end_date = new Date(end_date);

    // Reset status to 'pending' when updating
    updateData.status = 'pending';
    updateData.approved_by = null;
    updateData.approved_at = null;

    const updatedPermission = await prisma.permissions.update({
      where: { id_permissions: parseInt(id) },
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
      message: 'Perizinan berhasil diperbarui',
      data: updatedPermission
    });

  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui perizinan',
      error: error.message
    });
  }
};

/**
 * Delete permission
 * DELETE /api/permissions/:id
 */
exports.deletePermission = async (req, res) => {
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

    // Check if permission exists and belongs to user
    const permission = await prisma.permissions.findFirst({
      where: {
        id_permissions: parseInt(id),
        id_internships: internship.id_internships
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Perizinan tidak ditemukan'
      });
    }

    // Only allow delete if status is 'pending' or 'rejected'
    if (!['pending', 'rejected'].includes(permission.status)) {
      return res.status(400).json({
        success: false,
        message: 'Perizinan yang sudah diproses tidak dapat dihapus'
      });
    }

    // Delete permission
    await prisma.permissions.delete({
      where: { id_permissions: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Perizinan berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus perizinan',
      error: error.message
    });
  }
};

/**
 * Review permission (for mentor/kadiv/admin)
 * PUT /api/permissions/:id/review
 */
exports.reviewPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const reviewerId = req.user.id_users;
    const reviewerRole = req.user.role;

    // Check if permission exists
    const permission = await prisma.permissions.findUnique({
      where: { id_permissions: parseInt(id) }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Perizinan tidak ditemukan'
      });
    }

    // Determine new status based on action
    let newStatus;

    if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'approve') {
      // Simplified: any reviewer (mentor/kadiv/admin) can approve directly
      newStatus = 'approved';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action tidak valid. Gunakan "approve" atau "reject"'
      });
    }

    // Update permission status
    const updatedPermission = await prisma.permissions.update({
      where: { id_permissions: parseInt(id) },
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
      message: `Perizinan berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`,
      data: updatedPermission
    });

  } catch (error) {
    console.error('Review permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mereview perizinan',
      error: error.message
    });
  }
};
