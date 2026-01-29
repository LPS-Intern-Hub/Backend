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
