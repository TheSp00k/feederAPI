CREATE TABLE `report` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `status` tinyint(3) unsigned DEFAULT NULL,
  `object` varchar(191) DEFAULT NULL,
  `error` text DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `updated` datetime DEFAULT NULL,
  `userid` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;
