ALTER TABLE `feedback`
ADD COLUMN `approved` TINYINT(1) NULL AFTER `totalratingscore`;
