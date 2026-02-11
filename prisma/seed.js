const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data for clean testing
    console.log('🗑️  Clearing existing data...');
    await prisma.logbooks.deleteMany();
    await prisma.presensi.deleteMany();
    await prisma.permissions.deleteMany();
    await prisma.internships.deleteMany();
    await prisma.users.deleteMany();
    console.log('✅ Existing data cleared');

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
        where: { email: 'dimasdrn21@gmail.com' },
        update: {},
        create: {
            full_name: 'Dimas Radithya',
            email: 'dimasdrn21@gmail.com',
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
            position: 'Backend Intern',
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
            position: 'Frontend Intern',
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
            position: 'UI/UX Intern',
        },
    });

    console.log('✅ Users created successfully');

    // 2. Create Internships (Required for interns to use the app)
    console.log('📋 Creating internships...');

    await prisma.internships.create({
        data: {
            id_users: intern1.id_users,
            id_mentor: mentor1.id_users,
            start_date: new Date('2026-02-01'),
            end_date: new Date('2026-07-31'),
            status: 'aktif',
        },
    });

    await prisma.internships.create({
        data: {
            id_users: intern2.id_users,
            id_mentor: mentor1.id_users,
            start_date: new Date('2026-02-01'),
            end_date: new Date('2026-07-31'),
            status: 'aktif',
        },
    });

    await prisma.internships.create({
        data: {
            id_users: intern3.id_users,
            id_mentor: mentor2.id_users,
            start_date: new Date('2026-02-01'),
            end_date: new Date('2026-07-31'),
            status: 'aktif',
        },
    });

    console.log('✅ Internships created successfully');

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 7 Users created (1 admin, 2 mentors, 1 kadiv, 3 interns)');
    console.log('- 3 Internships created (with assigned mentors)');
    console.log('- No dummy data for permissions/presensi/logbooks - ready for manual testing!');
    console.log('\n🔑 Login credentials for testing:');
    console.log('Email: admin@simagang.com | Password: password123 | Role: admin');
    console.log('Email: dimasdrn21@gmail.com | Password: password123 | Role: mentor');
    console.log('Email: kadiv@simagang.com | Password: password123 | Role: kadiv');
    console.log('Email: intern1@simagang.com | Password: password123 | Role: intern');
    console.log('Email: intern2@simagang.com | Password: password123 | Role: intern');
    console.log('Email: intern3@simagang.com | Password: password123 | Role: intern');
    console.log('\n📝 Notes:');
    console.log('- All interns have active internships (Feb 1 - Jul 31, 2026)');
    console.log('- Intern1 & Intern2 → Mentor: Dimas Radithya');
    console.log('- Intern3 → Mentor: Siti Rahayu');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
