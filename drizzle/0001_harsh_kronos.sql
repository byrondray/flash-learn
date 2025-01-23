CREATE TABLE `flashCards` (
	`id` text PRIMARY KEY NOT NULL,
	`noteId` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`lastUpdated` text DEFAULT (current_timestamp),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quizQuestions` (
	`id` text PRIMARY KEY NOT NULL,
	`noteId` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
