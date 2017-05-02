CREATE TABLE `feedback` (
  `id` INT NOT NULL,
  `productid` VARCHAR(100) NULL,
  `commentheader` VARCHAR(512) NULL,
  `commentcontent` TEXT NULL,
  `created` DATETIME NOT NULL,
  PRIMARY KEY (`id`));
