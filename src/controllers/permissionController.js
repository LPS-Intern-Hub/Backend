// cSpell:words Terjadi kesalahan saat mengambil perizinan Perizinan tidak ditemukan Tanggal selesai boleh lebih awal dari tanggal mulai berhasil diajukan mengajukan sudah diproses dapat diubah diperbarui memperbarui dihapus menghapus kadiv sesuai untuk direview Gunakan atau disetujui ditolak mereview magang
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');
const { sendErrorResponse } = require('../utils/errorHandler');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const fs = require('fs');
const path = require('path');

/**
 * Get all permissions for current user
 * GET /api/permissions
 */
exports.getPermissions = async (req, res) => {
  try {
    const userId = req.user.id_users;
    const { status, type, page = 1, limit = 5 } = req.query;

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

    res.status(200).json({
      success: true,
      data: {
        ...permission,
        duration_days: durationDays
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

    // Handle file upload to S3 if exists
    let documentUrl = null;
    if (req.file) {
      const timestamp = Date.now();
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `permissions/${userId}-${timestamp}${fileExtension}`;
      
      try {
        const uploadResult = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);
        documentUrl = uploadResult.Location;
        console.log('File uploaded to S3:', documentUrl);
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Gagal mengupload dokumen pendukung'
        });
      }
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

    // Handle file upload to S3 if new file provided
    if (req.file) {
      const timestamp = Date.now();
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `permissions/${userId}-${timestamp}${fileExtension}`;
      
      try {
        // Delete old file if exists
        if (existingPermission.supporting_document_url) {
          const oldFileKey = existingPermission.supporting_document_url.split('.com/')[1];
          if (oldFileKey) {
            await deleteFromS3(oldFileKey);
          }
        }
        
        // Upload new file
        const uploadResult = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);
        updateData.supporting_document_url = uploadResult.Location;
        console.log('New file uploaded to S3:', uploadResult.Location);
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Gagal mengupload dokumen pendukung'
        });
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
    return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mereview perizinan', error);
  }
};
