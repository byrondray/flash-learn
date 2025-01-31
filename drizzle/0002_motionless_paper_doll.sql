CREATE TABLE `testScores` (
	`id` text PRIMARY KEY NOT NULL,
	`quizQuestionId` text,
	`score` text NOT NULL,
	`dateAttempted` text NOT NULL,
	FOREIGN KEY (`quizQuestionId`) REFERENCES `quizQuestions`(`id`) ON UPDATE no action ON DELETE cascade
);
