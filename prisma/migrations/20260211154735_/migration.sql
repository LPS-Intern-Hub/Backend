-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('admin', 'mentor', 'kadiv', 'intern') NOT NULL;
