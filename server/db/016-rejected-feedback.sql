ALTER TABLE `feedback`
ADD COLUMN `rejected` TINYINT(1) NULL AFTER `customerid`;
