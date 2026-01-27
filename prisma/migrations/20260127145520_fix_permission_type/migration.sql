/*
  Warnings:

  - The values [cuti,dinas] on the enum `permissions_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `permissions` MODIFY `type` ENUM('sakit', 'izin') NOT NULL;
