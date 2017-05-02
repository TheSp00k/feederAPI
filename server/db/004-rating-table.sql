CREATE TABLE `rating` (
  `id` INT NOT NULL,
  `type` VARCHAR(100) NULL DEFAULT 'default',
  `score` TINYINT(2) NULL,
  `feedbackid` VARCHAR(100) NULL,
  PRIMARY KEY (`id`));
