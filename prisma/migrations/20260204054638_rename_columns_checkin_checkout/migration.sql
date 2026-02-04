/*
  Warnings:

  - You are about to drop the column `image_url` on the `presensi` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `presensi` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `presensi` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `presensi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `presensi` DROP COLUMN `image_url`,
    DROP COLUMN `latitude`,
    DROP COLUMN `location`,
    DROP COLUMN `longitude`,
    ADD COLUMN `checkin_image_url` TEXT NULL,
    ADD COLUMN `checkin_latitude` DECIMAL(10, 8) NULL,
    ADD COLUMN `checkin_location` VARCHAR(255) NULL,
    ADD COLUMN `checkin_longitude` DECIMAL(11, 8) NULL,
    ADD COLUMN `checkout_image_url` TEXT NULL,
    ADD COLUMN `checkout_latitude` DECIMAL(10, 8) NULL,
    ADD COLUMN `checkout_location` VARCHAR(255) NULL,
    ADD COLUMN `checkout_longitude` DECIMAL(11, 8) NULL;
