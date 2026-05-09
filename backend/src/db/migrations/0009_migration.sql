-- Create money_categories table
CREATE TABLE `money_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`display_label` text NOT NULL,
	`color` text NOT NULL,
	`type` text NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Seed default expense categories for all existing users
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'food', 'Food & Dining', '#f97316', 'expense' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'transport', 'Transport', '#3b82f6', 'expense' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'entertainment', 'Entertainment', '#8b5cf6', 'expense' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'shopping', 'Shopping', '#ec4899', 'expense' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'health', 'Health', '#10b981', 'expense' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'utilities', 'Utilities', '#06b6d4', 'expense' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'rent', 'Rent', '#f59e0b', 'expense' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'education', 'Education', '#84cc16', 'expense' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'other', 'Other', '#64748b', 'expense' FROM users;
--> statement-breakpoint

-- Seed default income categories for all existing users
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'salary', 'Salary', '#22c55e', 'income' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'freelance', 'Freelance', '#10b981', 'income' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'investment', 'Investment', '#3b82f6', 'income' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'gift', 'Gift', '#a855f7', 'income' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'refund', 'Refund', '#f97316', 'income' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'opening_balance', 'Opening Balance', '#64748b', 'income' FROM users;
--> statement-breakpoint
INSERT INTO `money_categories` (`user_id`, `name`, `display_label`, `color`, `type`)
SELECT id, 'other_income', 'Other', '#94a3b8', 'income' FROM users;
--> statement-breakpoint

PRAGMA foreign_keys=OFF;
--> statement-breakpoint

-- Backfill expense_logs: add category_id, map old integer category enum to new IDs
ALTER TABLE `expense_logs` ADD COLUMN `category_id` integer;
--> statement-breakpoint
UPDATE `expense_logs`
SET `category_id` = (
	SELECT mc.id FROM `money_categories` mc
	WHERE mc.user_id = expense_logs.user_id AND mc.name = CASE expense_logs.category
		WHEN 1 THEN 'food'
		WHEN 2 THEN 'transport'
		WHEN 3 THEN 'entertainment'
		WHEN 4 THEN 'shopping'
		WHEN 5 THEN 'health'
		WHEN 6 THEN 'utilities'
		WHEN 7 THEN 'rent'
		WHEN 8 THEN 'education'
		WHEN 9 THEN 'other'
		ELSE 'other'
	END
	LIMIT 1
);
--> statement-breakpoint

-- Backfill deposit_logs: add category_id, map old text category enum to new IDs
ALTER TABLE `deposit_logs` ADD COLUMN `category_id` integer;
--> statement-breakpoint
UPDATE `deposit_logs`
SET `category_id` = (
	SELECT mc.id FROM `money_categories` mc
	WHERE mc.user_id = deposit_logs.user_id AND mc.name = CASE deposit_logs.category
		WHEN 'salary' THEN 'salary'
		WHEN 'freelance' THEN 'freelance'
		WHEN 'investment' THEN 'investment'
		WHEN 'gift' THEN 'gift'
		WHEN 'refund' THEN 'refund'
		WHEN 'opening_balance' THEN 'opening_balance'
		ELSE 'other_income'
	END
	LIMIT 1
);
--> statement-breakpoint

-- Backfill recurring_transactions: add category_id, map old integer category enum
ALTER TABLE `recurring_transactions` ADD COLUMN `category_id` integer;
--> statement-breakpoint
UPDATE `recurring_transactions`
SET `category_id` = (
	SELECT mc.id FROM `money_categories` mc
	WHERE mc.user_id = recurring_transactions.user_id AND mc.name = CASE recurring_transactions.category
		WHEN 1 THEN 'food'
		WHEN 2 THEN 'transport'
		WHEN 3 THEN 'entertainment'
		WHEN 4 THEN 'shopping'
		WHEN 5 THEN 'health'
		WHEN 6 THEN 'utilities'
		WHEN 7 THEN 'rent'
		WHEN 8 THEN 'education'
		WHEN 9 THEN 'other'
		ELSE 'other'
	END
	LIMIT 1
);
--> statement-breakpoint

-- Backfill budget_categories: add category_id, map old integer category enum
ALTER TABLE `budget_categories` ADD COLUMN `category_id` integer;
--> statement-breakpoint
UPDATE `budget_categories`
SET `category_id` = (
	SELECT mc.id FROM `money_categories` mc
	INNER JOIN `budgets` b ON b.id = budget_categories.budget_id
	WHERE mc.user_id = b.user_id AND mc.name = CASE budget_categories.category
		WHEN 1 THEN 'food'
		WHEN 2 THEN 'transport'
		WHEN 3 THEN 'entertainment'
		WHEN 4 THEN 'shopping'
		WHEN 5 THEN 'health'
		WHEN 6 THEN 'utilities'
		WHEN 7 THEN 'rent'
		WHEN 8 THEN 'education'
		WHEN 9 THEN 'other'
		ELSE 'other'
	END
	LIMIT 1
);
--> statement-breakpoint

-- Recreate expense_logs with FK constraint (drop old category column)
CREATE TABLE `__new_expense_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` integer,
	`date` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`category_id` integer NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `money_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_expense_logs`("id", "user_id", "wallet_id", "date", "amount", "currency", "category_id", "description", "created_at")
SELECT "id", "user_id", "wallet_id", "date", "amount", "currency", "category_id", "description", "created_at" FROM `expense_logs`;
--> statement-breakpoint
DROP TABLE `expense_logs`;
--> statement-breakpoint
ALTER TABLE `__new_expense_logs` RENAME TO `expense_logs`;
--> statement-breakpoint

-- Recreate deposit_logs with FK constraint (drop old category column)
CREATE TABLE `__new_deposit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` integer NOT NULL,
	`date` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`category_id` integer NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `money_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_deposit_logs`("id", "user_id", "wallet_id", "date", "amount", "currency", "category_id", "description", "created_at")
SELECT "id", "user_id", "wallet_id", "date", "amount", "currency", "category_id", "description", "created_at" FROM `deposit_logs`;
--> statement-breakpoint
DROP TABLE `deposit_logs`;
--> statement-breakpoint
ALTER TABLE `__new_deposit_logs` RENAME TO `deposit_logs`;
--> statement-breakpoint

-- Recreate recurring_transactions with FK constraint (drop old category column)
CREATE TABLE `__new_recurring_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` integer NOT NULL,
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
	`category_id` integer NOT NULL,
	`description` text,
	`next_date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `money_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recurring_transactions`("id", "user_id", "wallet_id", "type", "name", "amount", "period", "interval", "week_days", "month_end", "end_condition", "end_date", "occurrences", "category_id", "description", "next_date", "created_at")
SELECT "id", "user_id", "wallet_id", "type", "name", "amount", "period", "interval", "week_days", "month_end", "end_condition", "end_date", "occurrences", "category_id", "description", "next_date", "created_at" FROM `recurring_transactions`;
--> statement-breakpoint
DROP TABLE `recurring_transactions`;
--> statement-breakpoint
ALTER TABLE `__new_recurring_transactions` RENAME TO `recurring_transactions`;
--> statement-breakpoint

-- Recreate budget_categories with FK constraint (drop old category column)
CREATE TABLE `__new_budget_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `money_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_budget_categories`("id", "budget_id", "category_id")
SELECT "id", "budget_id", "category_id" FROM `budget_categories`;
--> statement-breakpoint
DROP TABLE `budget_categories`;
--> statement-breakpoint
ALTER TABLE `__new_budget_categories` RENAME TO `budget_categories`;
--> statement-breakpoint

PRAGMA foreign_keys=ON;
--> statement-breakpoint

CREATE UNIQUE INDEX `budget_categories_budget_category_unique` ON `budget_categories` (`budget_id`,`category_id`);
