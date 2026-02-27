-- AlterTable
ALTER TABLE `announcements` ADD COLUMN `end_date` DATE NULL,
    ADD COLUMN `start_date` DATE NULL;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id_audit_logs` VARCHAR(191) NOT NULL,
    `id_users` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NULL,
    `entity_id` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_audit_logs`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_id_users_fkey` FOREIGN KEY (`id_users`) REFERENCES `users`(`id_users`) ON DELETE SET NULL ON UPDATE CASCADE;
