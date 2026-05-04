ALTER TABLE `recurring_transactions` ADD `wallet_id` integer NOT NULL REFERENCES wallets(id);--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `type` text DEFAULT 'expense' NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `interval` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `week_days` text;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `month_end` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `end_condition` text DEFAULT 'forever' NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `end_date` text;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `occurrences` integer;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `description` text;