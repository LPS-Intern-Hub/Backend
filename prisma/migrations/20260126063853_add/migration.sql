/*
  Warnings:

  - Added the required column `latitude` to the `presensi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `presensi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `presensi` ADD COLUMN `latitude` DECIMAL(10, 8) NOT NULL,
    ADD COLUMN `longitude` DECIMAL(11, 8) NOT NULL;
