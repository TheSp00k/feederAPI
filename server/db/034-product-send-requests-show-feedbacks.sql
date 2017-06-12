ALTER TABLE `product`
ADD COLUMN `showfeedbacks` TINYINT(1) NULL AFTER `photourl`,
ADD COLUMN `sendrequests` TINYINT(1) NULL AFTER `showfeedbacks`;
