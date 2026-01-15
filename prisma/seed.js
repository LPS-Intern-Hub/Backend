const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // Hash password untuk semua user (password: "password123")
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users
  console.log('Creating users...');

  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      full_name: 'Dimas Rizky Nugraha',
      email: 'dimas.rizky@intern.com',
      role: 'intern',
      position: 'Frontend Developer',
      password: hashedPassword,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      full_name: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@intern.com',
      role: 'intern',
      position: 'Backend Developer',
      password: hashedPassword,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      full_name: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@intern.com',
      role: 'intern',
      position: 'UI/UX Designer',
      password: hashedPassword,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      full_name: 'Rina Kartika',
      email: 'rina.kartika@mentor.com',
      role: 'mentor',
      position: 'Senior Frontend Developer',
      password: hashedPassword,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      full_name: 'Budi Santoso',
      email: 'budi.santoso@mentor.com',
      role: 'mentor',
      position: 'Senior Backend Developer',
      password: hashedPassword,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      full_name: 'Dewi Lestari',
      email: 'dewi.lestari@sdm.com',
      role: 'SDM',
      position: 'HR Manager',
      password: hashedPassword,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      full_name: 'Agus Wijaya',
      email: 'agus.wijaya@kadiv.com',
      role: 'kadiv',
      position: 'Division Head of Technology',
      password: hashedPassword,
    },
  ];

  for (const user of users) {
    await prisma.users.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`✓ Created user: ${user.full_name} (${user.role})`);
  }

  // Create Internships for intern users
  console.log('\nCreating internships...');

  const internships = [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001', // Dimas
      start_date: new Date('2025-09-01'),
      end_date: new Date('2025-12-01'),
      status: 'active',
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440002', // Siti
      start_date: new Date('2025-08-15'),
      end_date: new Date('2025-11-15'),
      status: 'active',
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440003', // Ahmad
      start_date: new Date('2025-07-01'),
      end_date: new Date('2025-10-01'),
      status: 'completed',
    },
  ];

  for (const internship of internships) {
    await prisma.internships.upsert({
      where: { user_id: internship.user_id },
      update: {},
      create: internship,
    });
    console.log(`✓ Created internship for user_id: ${internship.user_id}`);
  }

  // Create some sample presences for Dimas
  console.log('\nCreating sample presences...');

  const presences = [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      date: new Date('2026-01-02'),
      check_in: new Date('2026-01-02 08:00:00'),
      check_out: new Date('2026-01-02 17:00:00'),
      location: 'Kantor Pusat Jakarta',
      image_url: '/uploads/presences/sample1.jpg',
      status: 'present',
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      date: new Date('2026-01-03'),
      check_in: new Date('2026-01-03 08:15:00'),
      check_out: new Date('2026-01-03 17:10:00'),
      location: 'Kantor Pusat Jakarta',
      image_url: '/uploads/presences/sample2.jpg',
      status: 'present',
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      date: new Date('2026-01-06'),
      check_in: new Date('2026-01-06 08:05:00'),
      check_out: new Date('2026-01-06 17:05:00'),
      location: 'Kantor Pusat Jakarta',
      image_url: '/uploads/presences/sample3.jpg',
      status: 'present',
    },
  ];

  for (const presence of presences) {
    await prisma.presences.create({
      data: presence,
    });
  }
  console.log(`✓ Created ${presences.length} sample presences`);

  // Create some sample logbooks for Dimas
  console.log('\nCreating sample logbooks...');

  const logbooks = [
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      date: new Date('2026-01-02'),
      title: 'Setup Development Environment',
      activity_detail: 'Melakukan setup development environment untuk project frontend. Instalasi Node.js, VS Code extensions, dan konfigurasi Git.',
      result_output: 'Development environment berhasil di-setup dan siap digunakan untuk pengembangan.',
      status: 'approved',
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      date: new Date('2026-01-03'),
      title: 'Membuat Dashboard Component',
      activity_detail: 'Mengembangkan component Dashboard menggunakan React. Membuat layout, styling, dan integrasi dengan API backend.',
      result_output: 'Dashboard component berhasil dibuat dengan tampilan responsive dan data dinamis dari API.',
      status: 'approved',
    },
    {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      date: new Date('2026-01-06'),
      title: 'Implementasi Authentication',
      activity_detail: 'Mengimplementasikan fitur authentication (login/logout) dan protected routes pada aplikasi frontend.',
      result_output: 'Fitur authentication berhasil diimplementasikan dengan token-based authentication.',
      status: 'sent',
    },
  ];

  for (const logbook of logbooks) {
    await prisma.logbooks.create({
      data: logbook,
    });
  }
  console.log(`✓ Created ${logbooks.length} sample logbooks`);

  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('═══════════════════════════════════════');
  console.log('Email: dimas.rizky@intern.com | Password: password123 (Intern)');
  console.log('Email: siti.nurhaliza@intern.com | Password: password123 (Intern)');
  console.log('Email: ahmad.fauzi@intern.com | Password: password123 (Intern)');
  console.log('Email: rina.kartika@mentor.com | Password: password123 (Mentor)');
  console.log('Email: budi.santoso@mentor.com | Password: password123 (Mentor)');
  console.log('Email: dewi.lestari@sdm.com | Password: password123 (SDM)');
  console.log('Email: agus.wijaya@kadiv.com | Password: password123 (Kadiv)');
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
