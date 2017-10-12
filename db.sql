CREATE TABLE IF NOT EXISTS `test` (
  `id` integer unsigned NOT NULL auto_increment,
  `name` varchar(32) NOT NULL,
  `age` integer unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;