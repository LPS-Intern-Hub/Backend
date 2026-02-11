-- AlterTable
ALTER TABLE `users` ADD COLUMN `bank_account_name` VARCHAR(100) NULL,
    ADD COLUMN `bank_account_number` VARCHAR(50) NULL,
    ADD COLUMN `bank_name` VARCHAR(100) NULL;
