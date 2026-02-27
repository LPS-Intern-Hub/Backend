const prisma = require('../utils/prisma');
const { sendErrorResponse } = require('../utils/errorHandler');
const { createAuditLog } = require('../middlewares/auditLogger');

/**
 * Get all announcements
 * GET /api/announcements
 */
exports.getAllAnnouncements = async (req, res) => {
    try {
        const { role } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const where = {};

        // Filter by role
        if (role && role !== 'all') {
            where.target_role = { in: [role, 'all'] };
        }

        // Non-admins only see announcements within active date range
        if (req.user.role !== 'admin') {
            where.AND = [
                {
                    OR: [
                        { start_date: null },
                        { start_date: { lte: today } }
                    ]
                },
                {
                    OR: [
                        { end_date: null },
                        { end_date: { gte: today } }
                    ]
                }
            ];
        }

        const announcements = await prisma.announcements.findMany({
            where,
            include: {
                author: {
                    select: {
                        full_name: true,
                        role: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: announcements
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil pengumuman', error);
    }
};

/**
 * Create announcement
 * POST /api/announcements
 */
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, target_role, start_date, end_date } = req.body;

        const announcement = await prisma.announcements.create({
            data: {
                title,
                content,
                target_role: target_role || 'all',
                id_author: req.user.id_users,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null
            }
        });

        // Create Audit Log
        await createAuditLog({
            id_users: req.user.id_users,
            action: 'CREATE_ANNOUNCEMENT',
            entity: 'announcements',
            entity_id: announcement.id_announcements,
            details: `Membuat pengumuman: ${title}`,
            req
        });

        res.status(201).json({
            success: true,
            message: 'Pengumuman berhasil dibuat',
            data: announcement
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat membuat pengumuman', error);
    }
};

/**
 * Update announcement
 * PUT /api/announcements/:id
 */
exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, target_role, start_date, end_date } = req.body;

        const announcement = await prisma.announcements.update({
            where: { id_announcements: id },
            data: {
                title,
                content,
                target_role,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null
            }
        });

        // Create Audit Log
        await createAuditLog({
            id_users: req.user.id_users,
            action: 'UPDATE_ANNOUNCEMENT',
            entity: 'announcements',
            entity_id: id,
            details: `Memperbarui pengumuman: ${title}`,
            req
        });

        res.status(200).json({
            success: true,
            message: 'Pengumuman berhasil diperbarui',
            data: announcement
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat memperbarui pengumuman', error);
    }
};

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 */
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await prisma.announcements.delete({
            where: { id_announcements: id }
        });

        // Create Audit Log
        await createAuditLog({
            id_users: req.user.id_users,
            action: 'DELETE_ANNOUNCEMENT',
            entity: 'announcements',
            entity_id: id,
            details: `Menghapus pengumuman: ${announcement.title}`,
            req
        });

        res.status(200).json({
            success: true,
            message: 'Pengumuman berhasil dihapus'
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat menghapus pengumuman', error);
    }
};
