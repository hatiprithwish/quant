CREATE TABLE `__new_recurring_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` integer,
	`type` text DEFAULT 'expense' NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`period` text NOT NULL,
	`interval` integer DEFAULT 1 NOT NULL,
	`week_days` text,
	`month_end` integer DEFAULT 0 NOT NULL,
	`end_condition` text DEFAULT 'forever' NOT NULL,
	`end_date` text,
	`occurrences` integer,
	`category_id` integer,
	`description` text,
	`next_date` text NOT NULL,
	`to_wallet_id` integer,
	`asset_id` integer,
	`from_asset_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_recurring_transactions`("id", "user_id", "wallet_id", "type", "name", "amount", "period", "interval", "week_days", "month_end", "end_condition", "end_date", "occurrences", "category_id", "description", "next_date", "to_wallet_id", "asset_id", "from_asset_id", "created_at") SELECT "id", "user_id", "wallet_id", "type", "name", "amount", "period", "interval", "week_days", "month_end", "end_condition", "end_date", "occurrences", "category_id", "description", "next_date", "to_wallet_id", "asset_id", "from_asset_id", "created_at" FROM `recurring_transactions`;--> statement-breakpoint
DROP TABLE `recurring_transactions`;--> statement-breakpoint
ALTER TABLE `__new_recurring_transactions` RENAME TO `recurring_transactions`;
