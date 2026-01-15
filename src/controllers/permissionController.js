// cSpell:words Terjadi kesalahan saat mengambil perizinan Perizinan tidak ditemukan Tanggal selesai boleh lebih awal dari tanggal mulai berhasil diajukan mengajukan sudah diproses dapat diubah diperbarui memperbarui dihapus menghapus kadiv sesuai untuk direview Gunakan atau disetujui ditolak mereview
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
    const userId = req.user.id;
    const { status, type } = req.query;

    // Build filter
    const where = { user_id: userId };
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }

    const permissions = await prisma.permissions.findMany({
      where,
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        type: true,
        title: true,
        reason: true,
        start_date: true,
        end_date: true,
        attachment_path: true,
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

    // Calculate duration for each permission
    const permissionsWithDuration = permissions.map(permission => {
      const startDate = new Date(permission.start_date);
      const endDate = new Date(permission.end_date);
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        ...permission,
        id: Number(permission.id), // Convert BigInt to Number
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
    const userId = req.user.id;

    const permission = await prisma.permissions.findFirst({
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
        id: Number(permission.id), // Convert BigInt to Number
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
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { type, title, reason, start_date, end_date } = req.body;

    // Check date validity
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
      });
    }

    // Prepare attachment path
    const attachmentPath = req.file ? `/uploads/permissions/${req.file.filename}` : null;

    // Create permission
    const permission = await prisma.permissions.create({
      data: {
        user_id: userId,
        type,
        title,
        reason,
        start_date: startDate,
        end_date: endDate,
        attachment_path: attachmentPath,
        status: 'sent'
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
      message: 'Perizinan berhasil diajukan',
      data: {
        ...permission,
        id: Number(permission.id) // Convert BigInt to Number
      }
    });

  } catch (error) {
    console.error('Create permission error:', error);
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
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
    const userId = req.user.id;
    const { type, title, reason, start_date, end_date } = req.body;

    // Check if permission exists and belongs to user
    const existingPermission = await prisma.permissions.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!existingPermission) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Perizinan tidak ditemukan'
      });
    }

    // Only allow update if status is 'sent' or 'rejected'
    if (!['sent', 'rejected'].includes(existingPermission.status)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
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

    // Handle new file upload
    if (req.file) {
      // Delete old file if exists
      if (existingPermission.attachment_path) {
        const oldFilePath = path.join(__dirname, '../../', existingPermission.attachment_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      updateData.attachment_path = `/uploads/permissions/${req.file.filename}`;
    }

    // Reset status to 'sent' when updating
    updateData.status = 'sent';

    const updatedPermission = await prisma.permissions.update({
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
      message: 'Perizinan berhasil diperbarui',
      data: updatedPermission
    });

  } catch (error) {
    console.error('Update permission error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
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
    const userId = req.user.id;

    // Check if permission exists and belongs to user
    const permission = await prisma.permissions.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Perizinan tidak ditemukan'
      });
    }

    // Only allow delete if status is 'sent' or 'rejected'
    if (!['sent', 'rejected'].includes(permission.status)) {
      return res.status(400).json({
        success: false,
        message: 'Perizinan yang sudah diproses tidak dapat dihapus'
      });
    }

    // Delete file if exists
    if (permission.attachment_path) {
      const filePath = path.join(__dirname, '../../', permission.attachment_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete permission
    await prisma.permissions.delete({
      where: { id: parseInt(id) }
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
 * Review permission (for mentor/kadiv)
 * PUT /api/permissions/:id/review
 */
exports.reviewPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const reviewerRole = req.user.role;

    // Check if permission exists
    const permission = await prisma.permissions.findUnique({
      where: { id: parseInt(id) }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Perizinan tidak ditemukan'
      });
    }

    // Determine next status based on current status and reviewer role
    let newStatus;

    if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'approve') {
      if (reviewerRole === 'mentor' && permission.status === 'sent') {
        newStatus = 'review_kadiv';
      } else if (reviewerRole === 'kadiv' && permission.status === 'review_kadiv') {
        newStatus = 'approved';
      } else if (reviewerRole === 'mentor' && permission.status === 'review_mentor') {
        newStatus = 'review_kadiv';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Status perizinan tidak sesuai untuk direview'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action tidak valid. Gunakan "approve" atau "reject"'
      });
    }

    // Update permission status
    const updatedPermission = await prisma.permissions.update({
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
