INSERT INTO `api`.`appuser` (`id`,`active`, `name`, `password`, `email`, `clientid`, `feedbackadmin`) VALUES (1, '1', 'feedbackAdmin', '$2a$10$dWwYGCmE0lpE71bB89jhFe6t5cfCgfH46mO4oUzsidUsGlLibJS0K', 'feedbackadmin@gmail.com', '0', '1');

INSERT INTO `Role` (`name`, `created`, `modified`) VALUES ('feedbackAdmin', now(), now());
INSERT INTO `RoleMapping` (`principalType`, `principalId`, `roleId`) VALUES ('USER', '1', '1');
