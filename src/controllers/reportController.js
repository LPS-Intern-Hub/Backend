const prisma = require('../utils/prisma');
const { sendErrorResponse } = require('../utils/errorHandler');
const xlsx = require('xlsx');

/**
 * Get all presences for admin monitoring
 * GET /api/presences/admin
 */
exports.getAllPresencesAdmin = async (req, res) => {
    try {
        const { date, month, year, status, division, search } = req.query;

        const where = {};

        if (date) {
            where.date = new Date(date);
        } else if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }

        if (status) where.status = status;

        if (search) {
            where.internship = {
                user: {
                    full_name: {
                        contains: search,
                        mode: 'insensitive'
                    }
                }
            };
        }

        const presences = await prisma.presensi.findMany({
            where,
            include: {
                internship: {
                    include: {
                        user: {
                            select: {
                                full_name: true,
                                position: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: presences
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengambil monitoring presensi', error);
    }
};

/**
 * Export report to Excel
 * GET /api/reports/export
 */
exports.exportReportExcel = async (req, res) => {
    try {
        const { type, month, year } = req.query;

        let data = [];
        let filename = '';

        if (type === 'presensi') {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const presences = await prisma.presensi.findMany({
                where: {
                    date: { gte: startDate, lte: endDate }
                },
                include: {
                    internship: { include: { user: true } }
                }
            });

            data = presences.map(p => ({
                Nama: p.internship.user.full_name,
                Email: p.internship.user.email,
                Tanggal: p.date.toISOString().split('T')[0],
                'Check-In': p.check_in ? p.check_in.toISOString().split('T')[1].substring(0, 5) : '-',
                'Check-Out': p.check_out ? p.check_out.toISOString().split('T')[1].substring(0, 5) : '-',
                Status: p.status,
                Lokasi: p.checkin_location || '-'
            }));
            filename = `Laporan_Presensi_${month}_${year}.xlsx`;
        } else if (type === 'logbook') {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const logbooks = await prisma.logbooks.findMany({
                where: {
                    date: { gte: startDate, lte: endDate }
                },
                include: {
                    internship: { include: { user: true } }
                }
            });

            data = logbooks.map(l => ({
                Nama: l.internship.user.full_name,
                Tanggal: l.date.toISOString().split('T')[0],
                Aktivitas: l.activity_detail,
                Output: l.result_output || '-',
                Status: l.status
            }));
            filename = `Laporan_Logbook_${month}_${year}.xlsx`;
        }

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Report');

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        return sendErrorResponse(res, 500, 'Terjadi kesalahan saat mengekspor laporan', error);
    }
};
