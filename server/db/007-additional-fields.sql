ALTER TABLE `feedback`
ADD COLUMN `totalratingscore` DECIMAL(1,1) NULL AFTER `created`;

ALTER TABLE `client`
ADD COLUMN `email` VARCHAR(100) NULL AFTER `licenseid`;
