ALTER TABLE `budgets` RENAME COLUMN "label" TO "name";--> statement-breakpoint
CREATE TABLE `budget_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_id` integer NOT NULL,
	`category` integer NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_categories_budget_category_unique` ON `budget_categories` (`budget_id`,`category`);--> statement-breakpoint
DROP INDEX `budgets_user_category_unique`;--> statement-breakpoint
ALTER TABLE `budgets` DROP COLUMN `category`;