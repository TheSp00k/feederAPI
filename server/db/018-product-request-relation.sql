CREATE TABLE `productrequest` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `productid` VARCHAR(255) NULL,
  `requestid` INT(11) NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `request`
ADD COLUMN `customerid` INT(11) NULL AFTER `type`;
