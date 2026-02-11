-- AlterTable
ALTER TABLE `internships` ADD COLUMN `id_mentor` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `permissions` ADD COLUMN `supporting_document_url` TEXT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `reset_token` TEXT NULL,
    ADD COLUMN `reset_token_expires` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_id_mentor_fkey` FOREIGN KEY (`id_mentor`) REFERENCES `users`(`id_users`) ON DELETE SET NULL ON UPDATE CASCADE;
