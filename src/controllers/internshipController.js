// cSpell:words Terjadi kesalahan saat mengambil magang tidak ditemukan aktif selesai diberhentikan
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

/**
 * Get current user's internship
 * GET /api/internships/me
 */
exports.getMyInternship = async (req, res) => {
    try {
        const userId = req.user.id_users;

        const internship = await prisma.internships.findFirst({
            where: { id_users: userId },
            select: {
                id_internships: true,
                id_users: true,
                start_date: true,
                end_date: true,
                status: true,
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
        });

        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Data magang tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            data: internship
        });

    } catch (error) {
        console.error('Get my internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data magang',
            error: error.message
        });
    }
};

/**
 * Get all internships (Admin/SDM only)
 * GET /api/internships
 */
exports.getAllInternships = async (req, res) => {
    try {
        const { status } = req.query;

        // Build filter
        const where = {};
        if (status) {
            where.status = status;
        }

        const internships = await prisma.internships.findMany({
            where,
            orderBy: {
                id_internships: 'desc'
            },
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
        });

        res.status(200).json({
            success: true,
            data: internships
        });

    } catch (error) {
        console.error('Get all internships error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data magang',
            error: error.message
        });
    }
};

/**
 * Get internship by ID (Admin/SDM only)
 * GET /api/internships/:id
 */
exports.getInternshipById = async (req, res) => {
    try {
        const { id } = req.params;

        const internship = await prisma.internships.findUnique({
            where: { id_internships: parseInt(id) },
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
        });

        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Data magang tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            data: internship
        });

    } catch (error) {
        console.error('Get internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data magang',
            error: error.message
        });
    }
};

/**
 * Create new internship (Admin/SDM only)
 * POST /api/internships
 */
exports.createInternship = async (req, res) => {
    try {
        // Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { id_users, start_date, end_date, status } = req.body;

        // Check if user exists
        const user = await prisma.users.findUnique({
            where: { id_users: parseInt(id_users) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Check if user already has internship
        const existingInternship = await prisma.internships.findFirst({
            where: { id_users: parseInt(id_users) }
        });

        if (existingInternship) {
            return res.status(400).json({
                success: false,
                message: 'User sudah memiliki data magang'
            });
        }

        // Create internship
        const internship = await prisma.internships.create({
            data: {
                id_users: parseInt(id_users),
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                status: status || 'aktif'
            },
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
        });

        res.status(201).json({
            success: true,
            message: 'Data magang berhasil dibuat',
            data: internship
        });

    } catch (error) {
        console.error('Create internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat membuat data magang',
            error: error.message
        });
    }
};

/**
 * Update internship (Admin/SDM only)
 * PUT /api/internships/:id
 */
exports.updateInternship = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date, status } = req.body;

        // Check if internship exists
        const existingInternship = await prisma.internships.findUnique({
            where: { id_internships: parseInt(id) }
        });

        if (!existingInternship) {
            return res.status(404).json({
                success: false,
                message: 'Data magang tidak ditemukan'
            });
        }

        // Prepare update data
        const updateData = {};
        if (start_date) updateData.start_date = new Date(start_date);
        if (end_date) updateData.end_date = new Date(end_date);
        if (status) updateData.status = status;

        const updatedInternship = await prisma.internships.update({
            where: { id_internships: parseInt(id) },
            data: updateData,
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
        });

        res.status(200).json({
            success: true,
            message: 'Data magang berhasil diperbarui',
            data: updatedInternship
        });

    } catch (error) {
        console.error('Update internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memperbarui data magang',
            error: error.message
        });
    }
};

/**
 * Delete internship (Admin/SDM only)
 * DELETE /api/internships/:id
 */
exports.deleteInternship = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if internship exists
        const internship = await prisma.internships.findUnique({
            where: { id_internships: parseInt(id) }
        });

        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Data magang tidak ditemukan'
            });
        }

        // Delete internship (will cascade to related records)
        await prisma.internships.delete({
            where: { id_internships: parseInt(id) }
        });

        res.status(200).json({
            success: true,
            message: 'Data magang berhasil dihapus'
        });

    } catch (error) {
        console.error('Delete internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus data magang',
            error: error.message
        });
    }
};
