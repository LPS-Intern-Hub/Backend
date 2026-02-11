// cSpell:words Terjadi kesalahan saat mengambil perizinan Perizinan tidak ditemukan Tanggal selesai boleh lebih awal dari tanggal mulai berhasil diajukan mengajukan sudah diproses dapat diubah diperbarui memperbarui dihapus menghapus kadiv sesuai untuk direview Gunakan atau disetujui ditolak mereview magang
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');
const { sendErrorResponse } = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');

/**
 * Get all permissions for current user
 * GET /api/permissions
 */
exports.getPermissions = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const userRole = req.user.role;
    const { status, type, page = 1, limit = 5 } = req.query;

    let where = {};

    // Role-based filtering
    if (userRole === 'intern') {
      // Intern: Get their own internship
      const internship = await prisma.internships.findFirst({
        where: { id_users: userId }
      });

      if (!internship) {
        return res.status(404).json({
          success: false,
          message: 'Data magang tidak ditemukan'
        });
      }

      where.id_internships = internship.id_internships;
    } else if (userRole === 'mentor' || userRole === 'kadiv') {
      // Mentor/Kadiv: Get permissions from interns they supervise
      const mentoredInternships = await prisma.internships.findMany({
        where: { id_mentor: userId },
        select: { id_internships: true }
      });

      if (mentoredInternships.length === 0) {
        // No interns assigned to this mentor
        return res.status(200).json({
          success: true,
          data: [],
          meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        });
      }

      where.id_internships = {
        in: mentoredInternships.map(i => i.id_internships)
      };
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Pagination setup
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await prisma.permissions.count({ where });

    const permissions = await prisma.permissions.findMany({
      where,
      orderBy: {
        id_permissions: 'desc'
      },
      skip,
      take: limitNum,
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
        rejection_reason: true,
        supporting_document_url: true,
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

      // Prepend base URL for local files
      let attachmentUrl = permission.supporting_document_url;
      if (attachmentUrl && attachmentUrl.startsWith('/uploads/')) {
        attachmentUrl = `http://localhost:3000${attachmentUrl}`;
      }

      return {
        ...permission,
        duration: durationDays,
        attachment_url: attachmentUrl
      };
    });

    res.status(200).json({
      success: true,
      data: permissionsWithDuration,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil data izin', error);
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

    // Prepend base URL for local files
    let attachmentUrl = permission.supporting_document_url;
    if (attachmentUrl && attachmentUrl.startsWith('/uploads/')) {
      attachmentUrl = `http://localhost:3000${attachmentUrl}`;
    }

    res.status(200).json({
      success: true,
      data: {
        ...permission,
        duration_days: durationDays,
        attachment_url: attachmentUrl
      }
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil data perizinan', error);
  }
};

/**
 * Create new permission
 * POST /api/permissions
 */
exports.createPermission = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Content-Type:', req.get('content-type'));

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

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

    // Generate title if not provided
    const permissionTitle = title || `${type === 'sakit' ? 'Sakit' : 'Izin'} - ${new Date(start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    // Check date validity
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
      });
    }

    // Handle file upload (local storage)
    let documentUrl = null;
    if (req.file) {
      // File already saved by multer, just construct the URL path
      documentUrl = `/uploads/permissions/${req.file.filename}`;
      console.log('File saved locally:', documentUrl);
    }

    // Create permission
    const permission = await prisma.permissions.create({
      data: {
        id_internships: internship.id_internships,
        type,
        title: permissionTitle,
        reason,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        supporting_document_url: documentUrl
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
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengajukan perizinan', error);
  }
};

/**
 * Update permission
 * PUT /api/permissions/:id
 */
exports.updatePermission = async (req, res) => {
  try {
    console.log('Update permission - body:', req.body);
    console.log('Update permission - params:', req.params);

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

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
        id_permissions: id,
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
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (reason !== undefined) updateData.reason = reason;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = new Date(end_date);

    // Handle file upload (local storage)
    if (req.file) {
      try {
        // Delete old file if exists
        if (existingPermission.supporting_document_url) {
          const oldFilePath = path.join(__dirname, '../../', existingPermission.supporting_document_url);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('Old file deleted:', oldFilePath);
          }
        }

        // File already saved by multer, just construct the URL path
        updateData.supporting_document_url = `/uploads/permissions/${req.file.filename}`;
        console.log('New file saved locally:', updateData.supporting_document_url);
      } catch (fileError) {
        console.error('File handling error:', fileError);
        // Continue with update even if file deletion fails
      }
    }

    // Validate dates if both provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
        });
      }
    }

    // Reset status to 'pending' when updating
    updateData.status = 'pending';
    updateData.approved_by = null;
    updateData.approved_at = null;

    console.log('Update data:', updateData);

    const updatedPermission = await prisma.permissions.update({
      where: { id_permissions: id },
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
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat memperbarui perizinan', error);
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
        id_permissions: id,
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
      where: { id_permissions: id }
    });

    res.status(200).json({
      success: true,
      message: 'Perizinan berhasil dihapus'
    });

  } catch (error) {
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat menghapus perizinan', error);
  }
};

/**
 * Review permission (for mentor/kadiv)
 * PUT /api/permissions/:id/review
 */
exports.reviewPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body; // 'approve' or 'reject', with optional rejection_reason
    const reviewerId = req.user.id_users;
    const reviewerRole = req.user.role;

    // Check if permission exists
    const permission = await prisma.permissions.findUnique({
      where: { id_permissions: id } // UUID is string, not integer
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Perizinan tidak ditemukan'
      });
    }

    // Determine new status based on action
    let newStatus;
    let updateData = {
      status: '',
      approved_by: reviewerId,
      approved_at: new Date()
    };

    if (action === 'reject') {
      // Validate rejection reason
      if (!rejection_reason || rejection_reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Alasan penolakan harus diisi'
        });
      }
      newStatus = 'rejected';
      updateData.status = newStatus;
      updateData.rejection_reason = rejection_reason;
    } else if (action === 'approve') {
      // Simplified: any reviewer (mentor/kadiv) can approve directly
      newStatus = 'approved';
      updateData.status = newStatus;
      updateData.rejection_reason = null; // Clear rejection reason on approval
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action tidak valid. Gunakan "approve" atau "reject"'
      });
    }

    // Update permission status
    const updatedPermission = await prisma.permissions.update({
      where: { id_permissions: id }, // UUID is string, not integer
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
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mereview perizinan', error);
  }
};
