PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_debts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`counterparty_name` text NOT NULL,
	`amount` real NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`date` text NOT NULL,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_debts`("id", "user_id", "type", "counterparty_name", "amount", "paid_amount", "status", "date", "color", "description", "created_at") SELECT "id", "user_id", "type", "counterparty_name", "amount", "paid_amount", "status", "date", "color", "description", "created_at" FROM `debts`;--> statement-breakpoint
DROP TABLE `debts`;--> statement-breakpoint
ALTER TABLE `__new_debts` RENAME TO `debts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;