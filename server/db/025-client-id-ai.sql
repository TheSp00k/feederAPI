ALTER TABLE `client`
CHANGE COLUMN `id` `id` INT(11) NOT NULL AUTO_INCREMENT ;

ALTER TABLE `api`.`product`
CHANGE COLUMN `created` `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ;
