-- AlterTable
ALTER TABLE `users` ADD COLUMN `failed_login_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `last_failed_login` DATETIME(3) NULL,
    ADD COLUMN `locked_until` DATETIME(3) NULL;
