/*
  Warnings:

  - The primary key for the `internships` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `logbooks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `presensi` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `internships` DROP FOREIGN KEY `internships_id_users_fkey`;

-- DropForeignKey
ALTER TABLE `logbooks` DROP FOREIGN KEY `logbooks_approved_by_fkey`;

-- DropForeignKey
ALTER TABLE `logbooks` DROP FOREIGN KEY `logbooks_id_internships_fkey`;

-- DropForeignKey
ALTER TABLE `permissions` DROP FOREIGN KEY `permissions_approved_by_fkey`;

-- DropForeignKey
ALTER TABLE `permissions` DROP FOREIGN KEY `permissions_id_internships_fkey`;

-- DropForeignKey
ALTER TABLE `presensi` DROP FOREIGN KEY `presensi_id_internships_fkey`;

-- DropForeignKey
ALTER TABLE `presensi` DROP FOREIGN KEY `presensi_id_permission_fkey`;

-- AlterTable
ALTER TABLE `internships` DROP PRIMARY KEY,
    MODIFY `id_internships` VARCHAR(191) NOT NULL,
    MODIFY `id_users` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_internships`);

-- AlterTable
ALTER TABLE `logbooks` DROP PRIMARY KEY,
    MODIFY `id_logbooks` VARCHAR(191) NOT NULL,
    MODIFY `id_internships` VARCHAR(191) NOT NULL,
    MODIFY `approved_by` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id_logbooks`);

-- AlterTable
ALTER TABLE `permissions` DROP PRIMARY KEY,
    MODIFY `id_permissions` VARCHAR(191) NOT NULL,
    MODIFY `id_internships` VARCHAR(191) NOT NULL,
    MODIFY `approved_by` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id_permissions`);

-- AlterTable
ALTER TABLE `presensi` DROP PRIMARY KEY,
    MODIFY `id_presensi` VARCHAR(191) NOT NULL,
    MODIFY `id_internships` VARCHAR(191) NOT NULL,
    MODIFY `id_permission` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id_presensi`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    MODIFY `id_users` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_users`);

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
