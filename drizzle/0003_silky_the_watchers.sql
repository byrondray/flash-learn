ALTER TABLE `quizQuestions` RENAME COLUMN "answer" TO "correctAnswer";--> statement-breakpoint
CREATE TABLE `questionOptions` (
	`id` text PRIMARY KEY NOT NULL,
	`questionId` text NOT NULL,
	`optionText` text NOT NULL,
	FOREIGN KEY (`questionId`) REFERENCES `quizQuestions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `quizQuestions` ADD `explanation` text NOT NULL;