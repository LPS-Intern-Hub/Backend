const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - uncomment if you want to reset data)
    // await prisma.logbooks.deleteMany();
    // await prisma.presensi.deleteMany();
    // await prisma.permissions.deleteMany();
    // await prisma.internships.deleteMany();
    // await prisma.users.deleteMany();

    // Hash password untuk semua user
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Users
    console.log('👤 Creating users...');

    const admin = await prisma.users.upsert({
        where: { email: 'admin@simagang.com' },
        update: {},
        create: {
            full_name: 'Admin Utama',
            email: 'admin@simagang.com',
            password: hashedPassword,
            role: 'admin',
            position: 'Administrator',
        },
    });

    const mentor1 = await prisma.users.upsert({
        where: { email: 'mentor1@simagang.com' },
        update: {},
        create: {
            full_name: 'Budi Santoso',
            email: 'mentor1@simagang.com',
            password: hashedPassword,
            role: 'mentor',
            position: 'Senior Developer',
        },
    });

    const mentor2 = await prisma.users.upsert({
        where: { email: 'mentor2@simagang.com' },
        update: {},
        create: {
            full_name: 'Siti Rahayu',
            email: 'mentor2@simagang.com',
            password: hashedPassword,
            role: 'mentor',
            position: 'UI/UX Designer',
        },
    });

    const kadiv = await prisma.users.upsert({
        where: { email: 'kadiv@simagang.com' },
        update: {},
        create: {
            full_name: 'Andi Wijaya',
            email: 'kadiv@simagang.com',
            password: hashedPassword,
            role: 'kadiv',
            position: 'Kepala Divisi IT',
        },
    });

    const intern1 = await prisma.users.upsert({
        where: { email: 'intern1@simagang.com' },
        update: {},
        create: {
            full_name: 'Dimas Pratama',
            email: 'intern1@simagang.com',
            password: hashedPassword,
            role: 'intern',
            position: 'Backend Developer Intern',
        },
    });

    const intern2 = await prisma.users.upsert({
        where: { email: 'intern2@simagang.com' },
        update: {},
        create: {
            full_name: 'Sarah Amanda',
            email: 'intern2@simagang.com',
            password: hashedPassword,
            role: 'intern',
            position: 'Frontend Developer Intern',
        },
    });

    const intern3 = await prisma.users.upsert({
        where: { email: 'intern3@simagang.com' },
        update: {},
        create: {
            full_name: 'Raka Mahendra',
            email: 'intern3@simagang.com',
            password: hashedPassword,
            role: 'intern',
            position: 'UI/UX Design Intern',
        },
    });

    console.log('✅ Users created successfully');

    // 2. Create Internships
    console.log('📋 Creating internships...');

    const internship1 = await prisma.internships.create({
        data: {
            id_users: intern1.id_users,
            start_date: new Date('2026-01-01'),
            end_date: new Date('2026-06-30'),
            status: 'aktif',
        },
    });

    const internship2 = await prisma.internships.create({
        data: {
            id_users: intern2.id_users,
            start_date: new Date('2026-01-15'),
            end_date: new Date('2026-07-15'),
            status: 'aktif',
        },
    });

    const internship3 = await prisma.internships.create({
        data: {
            id_users: intern3.id_users,
            start_date: new Date('2025-09-01'),
            end_date: new Date('2026-03-01'),
            status: 'selesai',
        },
    });

    console.log('✅ Internships created successfully');

    // 3. Create Permissions
    console.log('📝 Creating permissions...');

    const permission1 = await prisma.permissions.create({
        data: {
            id_internships: internship1.id_internships,
            type: 'sakit',
            title: 'Sakit Demam',
            reason: 'Demam tinggi dan perlu istirahat',
            start_date: new Date('2026-02-05'),
            end_date: new Date('2026-02-07'),
            status: 'approved',
            approved_by: mentor1.id_users,
            approved_at: new Date('2026-02-04'),
        },
    });

    const permission2 = await prisma.permissions.create({
        data: {
            id_internships: internship2.id_internships,
            type: 'izin',
            title: 'Keperluan Keluarga',
            reason: 'Ada acara keluarga yang tidak bisa ditinggalkan',
            start_date: new Date('2026-02-10'),
            end_date: new Date('2026-02-10'),
            status: 'pending',
        },
    });

    const permission3 = await prisma.permissions.create({
        data: {
            id_internships: internship1.id_internships,
            type: 'izin',
            title: 'Ujian Kampus',
            reason: 'Ujian tengah semester',
            start_date: new Date('2026-03-15'),
            end_date: new Date('2026-03-16'),
            status: 'rejected',
            approved_by: mentor1.id_users,
            approved_at: new Date('2026-03-14'),
        },
    });

    console.log('✅ Permissions created successfully');

    // 4. Create Presensi
    console.log('📍 Creating presensi records...');

    // Presensi untuk intern 1
    await prisma.presensi.createMany({
        data: [
            {
                id_internships: internship1.id_internships,
                date: new Date('2026-02-01'),
                check_in: new Date('2026-02-01T08:00:00'),
                check_out: new Date('2026-02-01T17:00:00'),
                latitude: -6.200000,
                longitude: 106.816666,
                location: 'Kantor Pusat Jakarta',
                image_url: '/uploads/presensi/intern1-01.jpg',
                status: 'hadir',
            },
            {
                id_internships: internship1.id_internships,
                date: new Date('2026-02-02'),
                check_in: new Date('2026-02-02T08:15:00'),
                check_out: new Date('2026-02-02T17:05:00'),
                latitude: -6.200000,
                longitude: 106.816666,
                location: 'Kantor Pusat Jakarta',
                image_url: '/uploads/presensi/intern1-02.jpg',
                status: 'terlambat',
            },
            {
                id_internships: internship1.id_internships,
                id_permission: permission1.id_permissions,
                date: new Date('2026-02-05'),
                check_in: null,
                check_out: null,
                latitude: 0,
                longitude: 0,
                location: null,
                image_url: null,
                status: 'izin',
            },
        ],
    });

    // Presensi untuk intern 2
    await prisma.presensi.createMany({
        data: [
            {
                id_internships: internship2.id_internships,
                date: new Date('2026-02-01'),
                check_in: new Date('2026-02-01T07:55:00'),
                check_out: new Date('2026-02-01T17:10:00'),
                latitude: -6.200000,
                longitude: 106.816666,
                location: 'Kantor Pusat Jakarta',
                image_url: '/uploads/presensi/intern2-01.jpg',
                status: 'hadir',
            },
            {
                id_internships: internship2.id_internships,
                date: new Date('2026-02-03'),
                check_in: null,
                check_out: null,
                latitude: 0,
                longitude: 0,
                location: null,
                image_url: null,
                status: 'alfa',
            },
        ],
    });

    console.log('✅ Presensi records created successfully');

    // 5. Create Logbooks
    console.log('📚 Creating logbooks...');

    await prisma.logbooks.createMany({
        data: [
            {
                id_internships: internship1.id_internships,
                date: new Date('2026-02-01'),
                activity_detail: 'Mempelajari dokumentasi API backend dan melakukan setup development environment',
                result_output: 'Berhasil setup local environment dan memahami struktur project',
                status: 'approved',
                approved_by: mentor1.id_users,
                approved_at: new Date('2026-02-02'),
            },
            {
                id_internships: internship1.id_internships,
                date: new Date('2026-02-02'),
                activity_detail: 'Membuat fitur CRUD untuk modul presensi',
                result_output: 'API endpoint untuk presensi telah selesai dibuat dan ditest',
                status: 'review_mentor',
            },
            {
                id_internships: internship1.id_internships,
                date: new Date('2026-02-03'),
                activity_detail: 'Implementasi sistem permission dan integrasi dengan presensi',
                result_output: null,
                status: 'draft',
            },
            {
                id_internships: internship2.id_internships,
                date: new Date('2026-02-01'),
                activity_detail: 'Membuat komponen UI untuk dashboard admin',
                result_output: 'Komponen dashboard sudah selesai dengan responsive design',
                status: 'approved',
                approved_by: mentor2.id_users,
                approved_at: new Date('2026-02-02'),
            },
            {
                id_internships: internship2.id_internships,
                date: new Date('2026-02-02'),
                activity_detail: 'Integrasi API dengan frontend React',
                result_output: 'Berhasil integrasi API login dan register',
                status: 'sent',
            },
            {
                id_internships: internship3.id_internships,
                date: new Date('2026-01-20'),
                activity_detail: 'Melakukan user testing untuk fitur presensi',
                result_output: 'Ditemukan beberapa bug UI yang perlu diperbaiki',
                status: 'approved',
                approved_by: kadiv.id_users,
                approved_at: new Date('2026-01-21'),
            },
        ],
    });

    console.log('✅ Logbooks created successfully');

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 7 Users created (1 admin, 2 mentors, 1 kadiv, 3 interns)');
    console.log('- 3 Internships created');
    console.log('- 3 Permissions created');
    console.log('- 5 Presensi records created');
    console.log('- 6 Logbooks created');
    console.log('\n🔑 Login credentials for testing:');
    console.log('Email: admin@simagang.com | Password: password123 | Role: admin');
    console.log('Email: mentor1@simagang.com | Password: password123 | Role: mentor');
    console.log('Email: kadiv@simagang.com | Password: password123 | Role: kadiv');
    console.log('Email: intern1@simagang.com | Password: password123 | Role: intern');
    console.log('Email: intern2@simagang.com | Password: password123 | Role: intern');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
