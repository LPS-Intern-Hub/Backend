-- CreateTable
CREATE TABLE `tasks` (
    `id_tasks` VARCHAR(191) NOT NULL,
    `id_internships` VARCHAR(191) NOT NULL,
    `id_mentor` VARCHAR(191) NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `due_date` DATE NULL,
    `status` ENUM('todo', 'in_progress', 'completed') NOT NULL DEFAULT 'todo',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_tasks`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_id_internships_fkey` FOREIGN KEY (`id_internships`) REFERENCES `internships`(`id_internships`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_id_mentor_fkey` FOREIGN KEY (`id_mentor`) REFERENCES `users`(`id_users`) ON DELETE SET NULL ON UPDATE CASCADE;
