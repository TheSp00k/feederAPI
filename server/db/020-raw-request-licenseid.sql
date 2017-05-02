ALTER TABLE `rawrequest`
ADD COLUMN `clientid` VARCHAR(100) NULL AFTER `customer`,
ADD COLUMN `licenseid` VARCHAR(255) NULL AFTER `clientid`;
