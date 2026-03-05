// cSpell:words Terjadi kesalahan saat mengambil magang tidak ditemukan aktif selesai diberhentikan
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

/**
 * Get internships mentored by current mentor
 * GET /api/internships/mentor
 */
exports.getMentorInternships = async (req, res) => {
    try {
        const mentorId = req.user.id_users;

        const internships = await prisma.internships.findMany({
            where: { id_mentor: mentorId },
            select: {
                id_internships: true,
                id_users: true,
                id_mentor: true,
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
            },
            orderBy: {
                start_date: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: internships
        });

    } catch (error) {
        console.error('Get mentor internships error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data intern yang dibimbing',
            error: error.message
        });
    }
};

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
 * Get all internships (Admin)
 * GET /api/internships/admin
 */
exports.getAllInternships = async (req, res) => {
    try {
        const { status, search } = req.query;

        const where = {};
        if (status) {
            where.status = status;
        }

        if (search) {
            where.user = {
                full_name: {
                    contains: search,
                    mode: 'insensitive'
                }
            };
        }

        const internships = await prisma.internships.findMany({
            where,
            select: {
                id_internships: true,
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
                },
                mentor: {
                    select: {
                        id_users: true,
                        full_name: true,
                        email: true,
                        position: true
                    }
                },
                _count: {
                    select: {
                        logbooks: true,
                        permissions: {
                            where: { status: 'approved' }
                        }
                    }
                }
            },
            orderBy: {
                start_date: 'desc'
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
            message: 'Terjadi kesalahan saat mengambil daftar magang',
            error: error.message
        });
    }
};
