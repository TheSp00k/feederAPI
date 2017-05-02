ALTER TABLE `rawrequest`
ADD COLUMN `created` DATETIME NOT NULL AFTER `licenseid`;
