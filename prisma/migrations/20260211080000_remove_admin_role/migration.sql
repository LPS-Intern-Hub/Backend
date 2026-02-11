-- RemoveAdminRole Migration
-- Step 1: Delete all users with role 'admin'
DELETE FROM `users` WHERE `role` = 'admin';

-- Step 2: Modify the enum to remove 'admin' value
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('mentor', 'kadiv', 'intern') NOT NULL;
