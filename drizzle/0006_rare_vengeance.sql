-- `userId` can't be added as NOT NULL directly if `testScores` already has
-- rows (SQLite has no ALTER COLUMN, and there's no default to backfill
-- with) — add nullable, backfill to the note owner as the best available
-- signal for historical rows (the old code never recorded the actual
-- test-taker), then rebuild the table with the constraint enforced.
ALTER TABLE `testScores` ADD `userId` text REFERENCES users(id) ON DELETE CASCADE;--> statement-breakpoint
UPDATE `testScores`
SET `userId` = (
  SELECT `notes`.`userId`
  FROM `quizQuestions`
  JOIN `notes` ON `notes`.`id` = `quizQuestions`.`noteId`
  WHERE `quizQuestions`.`id` = `testScores`.`quizQuestionId`
)
WHERE `userId` IS NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_testScores` (
	`id` text PRIMARY KEY NOT NULL,
	`quizQuestionId` text NOT NULL REFERENCES quizQuestions(id) ON DELETE CASCADE,
	`userId` text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	`score` text NOT NULL,
	`dateAttempted` text NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_testScores` (`id`, `quizQuestionId`, `userId`, `score`, `dateAttempted`)
SELECT `id`, `quizQuestionId`, `userId`, `score`, `dateAttempted` FROM `testScores`;--> statement-breakpoint
DROP TABLE `testScores`;--> statement-breakpoint
ALTER TABLE `__new_testScores` RENAME TO `testScores`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_testScores_quizQuestionId` ON `testScores` (`quizQuestionId`);--> statement-breakpoint
CREATE INDEX `idx_testScores_userId` ON `testScores` (`userId`);