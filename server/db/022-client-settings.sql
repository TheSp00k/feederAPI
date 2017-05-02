ALTER TABLE `client`
ADD COLUMN `requesttime` VARCHAR(10) NULL AFTER `email`,
ADD COLUMN `requestdelay` TINYINT(3) NULL AFTER `requesttime`,
ADD COLUMN `sendrequests` TINYINT(1) NULL AFTER `requestdelay`;
