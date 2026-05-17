CREATE TABLE `daily_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`ai_processed` integer DEFAULT 0 NOT NULL,
	`ai_processed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UK_daily_logs_user_id_date` ON `daily_logs` (`user_id`,`date`);--> statement-breakpoint
DROP TABLE `scratchpads`;--> statement-breakpoint