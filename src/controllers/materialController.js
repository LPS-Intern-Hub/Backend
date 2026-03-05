const prisma = require('../utils/prisma');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const { sendErrorResponse } = require('../utils/errorHandler');
const { createAuditLog } = require('../middlewares/auditLogger');

/**
 * Get all materials
 * GET /api/materials
 */
exports.getAllMaterials = async (req, res) => {
    try {
        const materials = await prisma.materials.findMany({
            include: {
                author: {
                    select: {
                        full_name: true,
                        role: true,
                        position: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: materials
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil materi', error);
    }
};

/**
 * Create new material (File or Link)
 * POST /api/materials
 */
exports.createMaterial = async (req, res) => {
    try {
        const { title, description, link_url } = req.body;
        const userId = req.user.id_users;

        let file_url = null;

        // Handle file upload if present
        if (req.file) {
            const fileName = `materials/${Date.now()}-${userId}-${req.file.originalname.replace(/\s+/g, '_')}`;
            const s3Result = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);
            file_url = s3Result.Location;
        }

        const material = await prisma.materials.create({
            data: {
                title,
                description,
                file_url,
                link_url: link_url || null,
                id_author: userId
            }
        });

        // Create Audit Log
        await createAuditLog({
            id_users: userId,
            action: 'CREATE_MATERIAL',
            entity: 'materials',
            entity_id: material.id_materials,
            details: `Mengunggah materi: ${title}`,
            req
        });

        res.status(201).json({
            success: true,
            message: 'Materi berhasil diunggah',
            data: material
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengunggah materi', error);
    }
};

/**
 * Delete material
 * DELETE /api/materials/:id
 */
exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id_users;

        const material = await prisma.materials.findUnique({
            where: { id_materials: id }
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Materi tidak ditemukan'
            });
        }

        // Check if user is the author or an admin
        if (material.id_author !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses untuk menghapus materi ini'
            });
        }

        // Delete from S3 if file exists
        if (material.file_url) {
            try {
                // Extract key from S3 URL
                const urlParts = material.file_url.split('.com/');
                if (urlParts.length > 1) {
                    const key = decodeURIComponent(urlParts[1]);
                    await deleteFromS3(key);
                }
            } catch (s3Error) {
                console.error('Error deleting from S3:', s3Error);
            }
        }

        await prisma.materials.delete({
            where: { id_materials: id }
        });

        // Create Audit Log
        await createAuditLog({
            id_users: userId,
            action: 'DELETE_MATERIAL',
            entity: 'materials',
            entity_id: id,
            details: `Menghapus materi: ${material.title}`,
            req
        });

        res.status(200).json({
            success: true,
            message: 'Materi berhasil dihapus'
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat menghapus materi', error);
    }
};
