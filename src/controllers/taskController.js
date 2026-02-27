const prisma = require('../utils/prisma');
const { sendErrorResponse } = require('../utils/errorHandler');

/**
 * Get all tasks (filtered by role)
 * GET /api/tasks
 */
exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.id_users;
        const userRole = req.user.role;
        const { status, internship_id } = req.query;

        let where = {};

        if (userRole === 'intern') {
            const internship = await prisma.internships.findFirst({
                where: { id_users: userId }
            });
            if (!internship) return res.status(404).json({ success: false, message: 'Data magang tidak ditemukan' });
            where.id_internships = internship.id_internships;
        } else if (userRole === 'mentor') {
            where.id_mentor = userId;
            if (internship_id) {
                where.id_internships = internship_id;
            }
        } else if (userRole === 'admin' || userRole === 'kadiv') {
            if (internship_id) {
                where.id_internships = internship_id;
            }
        }

        if (status) {
            where.status = status;
        }

        const tasks = await prisma.tasks.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                internship: {
                    include: {
                        user: {
                            select: { id_users: true, full_name: true, email: true }
                        }
                    }
                },
                mentor: {
                    select: { id_users: true, full_name: true }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil tugas', error);
    }
};

/**
 * Create a new task (Mentor only)
 * POST /api/tasks
 */
exports.createTask = async (req, res) => {
    try {
        const { id_internships, title, description, due_date } = req.body;
        const mentorId = req.user.id_users;

        if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Hanya mentor atau admin yang dapat membuat tugas' });
        }

        const task = await prisma.tasks.create({
            data: {
                id_internships,
                id_mentor: mentorId,
                title,
                description,
                due_date: due_date ? new Date(due_date) : null,
                status: 'todo'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Tugas berhasil dibuat',
            data: task
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat membuat tugas', error);
    }
};

/**
 * Update task status (Intern or Mentor)
 * PATCH /api/tasks/:id/status
 */
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id_users;
        const userRole = req.user.role;

        const task = await prisma.tasks.findUnique({
            where: { id_tasks: id },
            include: { internship: true }
        });

        if (!task) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });

        // Authorization check
        if (userRole === 'intern') {
            if (task.internship.id_users !== userId) {
                return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke tugas ini' });
            }
        } else if (userRole === 'mentor') {
            if (task.id_mentor !== userId) {
                return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke tugas ini' });
            }
        }

        const updatedTask = await prisma.tasks.update({
            where: { id_tasks: id },
            data: { status }
        });

        res.status(200).json({
            success: true,
            message: 'Status tugas berhasil diperbarui',
            data: updatedTask
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat memperbarui status tugas', error);
    }
};

/**
 * Update task details (Mentor only)
 * PUT /api/tasks/:id
 */
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, due_date, status } = req.body;
        const mentorId = req.user.id_users;

        const task = await prisma.tasks.findUnique({
            where: { id_tasks: id }
        });

        if (!task) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
        if (task.id_mentor !== mentorId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk mengubah tugas ini' });
        }

        const updatedTask = await prisma.tasks.update({
            where: { id_tasks: id },
            data: {
                title: title || task.title,
                description: description !== undefined ? description : task.description,
                due_date: due_date ? new Date(due_date) : task.due_date,
                status: status || task.status
            }
        });

        res.status(200).json({
            success: true,
            message: 'Tugas berhasil diperbarui',
            data: updatedTask
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat memperbarui tugas', error);
    }
};

/**
 * Delete task (Mentor only)
 * DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const mentorId = req.user.id_users;

        const task = await prisma.tasks.findUnique({
            where: { id_tasks: id }
        });

        if (!task) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
        if (task.id_mentor !== mentorId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk menghapus tugas ini' });
        }

        await prisma.tasks.delete({
            where: { id_tasks: id }
        });

        res.status(200).json({
            success: true,
            message: 'Tugas berhasil dihapus'
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat menghapus tugas', error);
    }
};
