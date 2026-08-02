CREATE TABLE `noteCollaborators` (
	`noteId` text NOT NULL,
	`userId` text NOT NULL,
	`permission` text DEFAULT 'edit' NOT NULL,
	`addedAt` text DEFAULT (current_timestamp),
	PRIMARY KEY(`noteId`, `userId`),
	FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_noteCollaborators_noteId` ON `noteCollaborators` (`noteId`);--> statement-breakpoint
CREATE INDEX `idx_noteCollaborators_userId` ON `noteCollaborators` (`userId`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_testScores` (
	`id` text PRIMARY KEY NOT NULL,
	`quizQuestionId` text NOT NULL,
	`score` text NOT NULL,
	`dateAttempted` text NOT NULL,
	FOREIGN KEY (`quizQuestionId`) REFERENCES `quizQuestions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_testScores`("id", "quizQuestionId", "score", "dateAttempted") SELECT "id", "quizQuestionId", "score", "dateAttempted" FROM `testScores`;--> statement-breakpoint
DROP TABLE `testScores`;--> statement-breakpoint
ALTER TABLE `__new_testScores` RENAME TO `testScores`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_testScores_quizQuestionId` ON `testScores` (`quizQuestionId`);--> statement-breakpoint
ALTER TABLE `notes` ADD `yjsState` blob;--> statement-breakpoint
ALTER TABLE `notes` ADD `inviteToken` text;--> statement-breakpoint
ALTER TABLE `notes` ADD `invitePermission` text DEFAULT 'edit' NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` ADD `quizShareToken` text;--> statement-breakpoint
ALTER TABLE `notes` ADD `flashcardShareToken` text;--> statement-breakpoint
CREATE UNIQUE INDEX `notes_inviteToken_unique` ON `notes` (`inviteToken`);--> statement-breakpoint
CREATE UNIQUE INDEX `notes_quizShareToken_unique` ON `notes` (`quizShareToken`);--> statement-breakpoint
CREATE UNIQUE INDEX `notes_flashcardShareToken_unique` ON `notes` (`flashcardShareToken`);--> statement-breakpoint
CREATE INDEX `idx_notes_userId` ON `notes` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_flashCards_noteId` ON `flashCards` (`noteId`);--> statement-breakpoint
CREATE INDEX `idx_questionOptions_questionId` ON `questionOptions` (`questionId`);--> statement-breakpoint
CREATE INDEX `idx_quizQuestions_noteId` ON `quizQuestions` (`noteId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);