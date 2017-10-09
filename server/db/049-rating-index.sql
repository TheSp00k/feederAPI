ALTER TABLE `rating`
CHANGE COLUMN `feedbackid` `feedbackid` INT(11) NULL DEFAULT NULL ,
ADD INDEX `FEEDBACK_INDEX` (`feedbackid` ASC);