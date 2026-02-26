const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { sendErrorResponse } = require('../utils/errorHandler');

/**
 * Get all users (Admin only)
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 10, search = '' } = req.query;

        const query = {};
        if (role) {
            query.role = role;
        }
        if (search) {
            query.full_name = {
                contains: search
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [users, totalItems] = await Promise.all([
            prisma.users.findMany({
                where: query,
                select: {
                    id_users: true,
                    full_name: true,
                    email: true,
                    role: true,
                    position: true,
                    created_at: true,
                    locked_until: true,
                    internships: {
                        where: { status: 'aktif' },
                        select: {
                            start_date: true,
                            end_date: true,
                            id_mentor: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip,
                take
            }),
            prisma.users.count({ where: query })
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / take),
                currentPage: parseInt(page),
                limit: take
            }
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil data user', error);
    }
};

/**
 * Create a new user (Admin only)
 * POST /api/users
 */
exports.createUser = async (req, res) => {
    try {
        const { full_name, email, role, position, start_date, end_date, id_mentor } = req.body;

        if (!['admin', 'mentor', 'kadiv', 'intern'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role tidak valid' });
        }

        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash('password123', 10);

        // Transaction to ensure both User and Internship are created if role is intern
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.users.create({
                data: {
                    full_name,
                    email,
                    role,
                    position,
                    password: hashedPassword
                }
            });

            if (role === 'intern') {
                if (!start_date || !end_date) {
                    throw new Error('Untuk role intern, start_date dan end_date harus diisi');
                }
                await tx.internships.create({
                    data: {
                        id_users: newUser.id_users,
                        id_mentor: id_mentor || null,
                        start_date: new Date(start_date),
                        end_date: new Date(end_date),
                        status: 'aktif'
                    }
                });
            }
            return newUser;
        });

        res.status(201).json({
            success: true,
            message: 'User berhasil dibuat',
            data: { id_users: result.id_users, full_name, email, role }
        });
    } catch (error) {
        if (error.message === 'Untuk role intern, start_date dan end_date harus diisi') {
            return res.status(400).json({ success: false, message: error.message });
        }
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat membuat user', error);
    }
};

/**
 * Edit user role
 * PUT /api/users/:id/role
 */
exports.editUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'mentor', 'kadiv', 'intern'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role tidak valid'
            });
        }

        const user = await prisma.users.update({
            where: { id_users: id },
            data: { role },
            select: {
                id_users: true,
                full_name: true,
                email: true,
                role: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Role user berhasil diupdate',
            data: user
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengupdate role user', error);
    }
};

/**
 * Update user details
 * PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role, position, start_date, end_date, id_mentor } = req.body;

        if (!['admin', 'mentor', 'kadiv', 'intern'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role tidak valid' });
        }

        const existingUser = await prisma.users.findUnique({ where: { id_users: id } });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const emailCheck = await prisma.users.findFirst({
            where: { email, id_users: { not: id } }
        });
        if (emailCheck) {
            return res.status(400).json({ success: false, message: 'Email sudah digunakan user lain' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.users.update({
                where: { id_users: id },
                data: { full_name, email, role, position }
            });

            if (role === 'intern') {
                if (!start_date || !end_date) {
                    throw new Error('Untuk role intern, start_date dan end_date harus diisi');
                }

                const existingInternship = await tx.internships.findFirst({
                    where: { id_users: id, status: 'aktif' }
                });

                if (existingInternship) {
                    await tx.internships.update({
                        where: { id_internships: existingInternship.id_internships },
                        data: {
                            id_mentor: id_mentor || null,
                            start_date: new Date(start_date),
                            end_date: new Date(end_date)
                        }
                    });
                } else {
                    await tx.internships.create({
                        data: {
                            id_users: id,
                            id_mentor: id_mentor || null,
                            start_date: new Date(start_date),
                            end_date: new Date(end_date),
                            status: 'aktif'
                        }
                    });
                }
            }
            return updatedUser;
        });

        res.status(200).json({
            success: true,
            message: 'User berhasil diupdate',
            data: result
        });
    } catch (error) {
        if (error.message === 'Untuk role intern, start_date dan end_date harus diisi') {
            return res.status(400).json({ success: false, message: error.message });
        }
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengupdate user', error);
    }
};

/**
 * Nonaktifkan / Aktifkan user
 * PUT /api/users/:id/status
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Use locked_until far in the future to deactivate
        const lockedUntil = isActive ? null : new Date('2099-12-31T23:59:59Z');

        const user = await prisma.users.update({
            where: { id_users: id },
            data: {
                locked_until: lockedUntil,
                // Also invalidate tokens when deactivating
                token_version: isActive ? undefined : { increment: 1 }
            },
            select: {
                id_users: true,
                full_name: true,
                email: true,
                locked_until: true
            }
        });

        res.status(200).json({
            success: true,
            message: isActive ? 'User berhasil diaktifkan' : 'User berhasil dinonaktifkan',
            data: user
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengubah status user', error);
    }
};

/**
 * Reset password
 * PUT /api/users/:id/reset-password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;

        // Set default password to "password123"
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await prisma.users.update({
            where: { id_users: id },
            data: {
                password: hashedPassword,
                token_version: { increment: 1 }, // Invalidate current sessions
                failed_login_count: 0,
                locked_until: null
            }
        });

        res.status(200).json({
            success: true,
            message: 'Password berhasil direset menjadi "password123"'
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mereset password', error);
    }
};
