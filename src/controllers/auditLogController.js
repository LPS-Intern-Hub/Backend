const prisma = require('../utils/prisma');
const { sendErrorResponse } = require('../utils/errorHandler');

/**
 * Get all audit logs
 * GET /api/audit-logs
 */
exports.getAllAuditLogs = async (req, res) => {
    try {
        const { action, entity, userId, limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (userId) where.id_users = userId;

        const [logs, total] = await Promise.all([
            prisma.auditLogs.findMany({
                where,
                include: {
                    user: {
                        select: {
                            full_name: true,
                            email: true,
                            role: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: parseInt(limit),
                skip: skip
            }),
            prisma.auditLogs.count({ where })
        ]);

        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil log audit', error);
    }
};
