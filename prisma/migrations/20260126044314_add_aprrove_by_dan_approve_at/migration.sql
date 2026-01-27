-- CreateTable
CREATE TABLE `users` (
    `id_users` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'mentor', 'kadiv', 'intern') NOT NULL,
    `position` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id_users`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `internships` (
    `id_internships` INTEGER NOT NULL AUTO_INCREMENT,
    `id_users` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('aktif', 'selesai', 'diberhentikan') NOT NULL,

    PRIMARY KEY (`id_internships`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id_permissions` INTEGER NOT NULL AUTO_INCREMENT,
    `id_internships` INTEGER NOT NULL,
    `type` ENUM('sakit', 'cuti', 'dinas') NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `reason` TEXT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,

    PRIMARY KEY (`id_permissions`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presensi` (
    `id_presensi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_internships` INTEGER NOT NULL,
    `id_permission` INTEGER NULL,
    `date` DATE NOT NULL,
    `check_in` TIME NULL,
    `check_out` TIME NULL,
    `location` VARCHAR(255) NULL,
    `image_url` TEXT NULL,
    `status` ENUM('hadir', 'izin', 'alfa', 'terlambat') NOT NULL,

    PRIMARY KEY (`id_presensi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logbooks` (
    `id_logbooks` INTEGER NOT NULL AUTO_INCREMENT,
    `id_internships` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `activity_detail` TEXT NOT NULL,
    `result_output` TEXT NULL,
    `status` ENUM('draft', 'sent', 'review_mentor', 'review_kadiv', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,

    PRIMARY KEY (`id_logbooks`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_id_users_fkey` FOREIGN KEY (`id_users`) REFERENCES `users`(`id_users`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_id_internships_fkey` FOREIGN KEY (`id_internships`) REFERENCES `internships`(`id_internships`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id_users`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presensi` ADD CONSTRAINT `presensi_id_internships_fkey` FOREIGN KEY (`id_internships`) REFERENCES `internships`(`id_internships`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presensi` ADD CONSTRAINT `presensi_id_permission_fkey` FOREIGN KEY (`id_permission`) REFERENCES `permissions`(`id_permissions`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logbooks` ADD CONSTRAINT `logbooks_id_internships_fkey` FOREIGN KEY (`id_internships`) REFERENCES `internships`(`id_internships`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logbooks` ADD CONSTRAINT `logbooks_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id_users`) ON DELETE SET NULL ON UPDATE CASCADE;
