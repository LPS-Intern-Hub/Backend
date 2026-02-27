const prisma = require('../utils/prisma');

/**
 * Utility to create audit log
 * @param {Object} params - { id_users, action, entity, entity_id, details, req }
 */
const createAuditLog = async ({ id_users, action, entity, entity_id, details, req }) => {
    try {
        await prisma.auditLogs.create({
            data: {
                id_users,
                action,
                entity,
                entity_id,
                details,
                ip_address: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null,
                user_agent: req ? req.headers['user-agent'] : null
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to avoid breaking the main request
    }
};

module.exports = { createAuditLog };
