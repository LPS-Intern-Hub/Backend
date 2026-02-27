-- CreateTable
CREATE TABLE `announcements` (
    `id_announcements` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `content` TEXT NOT NULL,
    `target_role` VARCHAR(191) NOT NULL DEFAULT 'all',
    `id_author` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_announcements`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_id_author_fkey` FOREIGN KEY (`id_author`) REFERENCES `users`(`id_users`) ON DELETE RESTRICT ON UPDATE CASCADE;
