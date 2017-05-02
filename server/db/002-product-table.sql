CREATE TABLE `product` (
  `id` INT NOT NULL,
  `name` VARCHAR(255) NULL,
  `description` VARCHAR(512) NULL,
  `feedbackid` VARCHAR(100) NULL,
  `created` DATETIME NOT NULL,
  PRIMARY KEY (`id`));
