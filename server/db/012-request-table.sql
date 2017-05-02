CREATE TABLE `request` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `clientid` VARCHAR(100) NULL,
  `created` TIMESTAMP NULL,
  `status` VARCHAR(50) NULL,
  `type` VARCHAR(50) NULL,
  PRIMARY KEY (`id`));
