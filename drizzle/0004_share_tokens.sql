ALTER TABLE `notes` ADD `quizShareToken` text;--> statement-breakpoint
ALTER TABLE `notes` ADD `flashcardShareToken` text;--> statement-breakpoint
CREATE UNIQUE INDEX `notes_quizShareToken_unique` ON `notes` (`quizShareToken`);--> statement-breakpoint
CREATE UNIQUE INDEX `notes_flashcardShareToken_unique` ON `notes` (`flashcardShareToken`);
