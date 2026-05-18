CREATE TABLE `decision_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`description` text NOT NULL,
	`alignment` text DEFAULT 'neutral' NOT NULL,
	`related_quest_id` text,
	`source` text DEFAULT 'user_reported' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `elimination_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`description` text NOT NULL,
	`linked_time_bucket_id` integer,
	`linked_money_category_id` integer,
	`linked_food_type` text,
	`result` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`linked_time_bucket_id`) REFERENCES `time_buckets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`linked_money_category_id`) REFERENCES `money_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goal_change_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`quest_id` text NOT NULL,
	`change_type` text NOT NULL,
	`reason` text NOT NULL,
	`old_description` text,
	`new_description` text,
	`xp_penalty` integer DEFAULT 0 NOT NULL,
	`cooling_off_until` text NOT NULL,
	`confirmed_at` text,
	`cancelled_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `habit_log_extractions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`daily_log_id` integer NOT NULL,
	`date` text NOT NULL,
	`habit_key` text NOT NULL,
	`occurred` integer DEFAULT 1 NOT NULL,
	`source_text` text,
	`source_type` text DEFAULT 'ai' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`daily_log_id`) REFERENCES `daily_logs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `score_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`period_type` text NOT NULL,
	`period_start` text NOT NULL,
	`score` real NOT NULL,
	`component_scores` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trajectory_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`escape_number` real,
	`monthly_investment_target` real,
	`assumed_annual_return_rate` real DEFAULT 0.12,
	`current_monthly_income` real,
	`income_milestone_year1` real,
	`income_milestone_year3` real,
	`checkin_due` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trajectory_config_user_id_unique` ON `trajectory_config` (`user_id`);--> statement-breakpoint
CREATE TABLE `weekly_checkins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`task_completion_score` real,
	`elimination_score` real,
	`decision_alignment_score` real,
	`confidence_score` real,
	`weekly_score` real,
	`ai_analysis` text,
	`user_corrections` text,
	`ai_model_version` text,
	`reviewed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UK_weekly_checkins_user_week` ON `weekly_checkins` (`user_id`,`week_start`);--> statement-breakpoint
ALTER TABLE `quest_milestones` ADD `projected_date` text;--> statement-breakpoint
ALTER TABLE `quest_tasks` ADD `phase_tag` text;--> statement-breakpoint
ALTER TABLE `quests` ADD `trajectory_phase` text;--> statement-breakpoint
ALTER TABLE `quests` ADD `parent_quest_id` text REFERENCES quests(id);--> statement-breakpoint
ALTER TABLE `quests` ADD `escape_number` real;