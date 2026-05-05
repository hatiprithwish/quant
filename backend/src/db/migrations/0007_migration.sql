CREATE TABLE `quest_milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quest_id` text NOT NULL,
	`name` text NOT NULL,
	`xp_reward` integer DEFAULT 100 NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_date` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quest_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quest_id` text NOT NULL,
	`milestone_id` integer,
	`name` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`xp_reward` integer DEFAULT 20 NOT NULL,
	`due_date` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`milestone_id`) REFERENCES `quest_milestones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quest_xp_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`quest_id` text,
	`source_type` text NOT NULL,
	`source_id` integer,
	`xp` integer NOT NULL,
	`occurred_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`color` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`deadline` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `time_buckets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`is_distraction` integer DEFAULT 0 NOT NULL,
	`quest_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO time_buckets (user_id, name, color, is_distraction)
SELECT DISTINCT tl.user_id, 'career', '#3b82f6', 0 FROM time_logs tl;
--> statement-breakpoint
INSERT INTO time_buckets (user_id, name, color, is_distraction)
SELECT DISTINCT tl.user_id, 'sleep', '#8b5cf6', 0 FROM time_logs tl;
--> statement-breakpoint
INSERT INTO time_buckets (user_id, name, color, is_distraction)
SELECT DISTINCT tl.user_id, 'maintenance', '#6b7280', 0 FROM time_logs tl;
--> statement-breakpoint
INSERT INTO time_buckets (user_id, name, color, is_distraction)
SELECT DISTINCT tl.user_id, 'fitness', '#10b981', 0 FROM time_logs tl;
--> statement-breakpoint
INSERT INTO time_buckets (user_id, name, color, is_distraction)
SELECT DISTINCT tl.user_id, 'learning', '#f59e0b', 0 FROM time_logs tl;
--> statement-breakpoint
INSERT INTO time_buckets (user_id, name, color, is_distraction)
SELECT DISTINCT tl.user_id, 'social', '#ec4899', 0 FROM time_logs tl;
--> statement-breakpoint
INSERT INTO time_buckets (user_id, name, color, is_distraction)
SELECT DISTINCT tl.user_id, 'entertainment', '#ef4444', 1 FROM time_logs tl;
--> statement-breakpoint
INSERT INTO time_buckets (user_id, name, color, is_distraction)
SELECT DISTINCT tl.user_id, 'personal-dev', '#06b6d4', 0 FROM time_logs tl;
--> statement-breakpoint
ALTER TABLE `time_logs` ADD `bucket_id` integer REFERENCES time_buckets(id);
--> statement-breakpoint
UPDATE time_logs SET bucket_id = (
  SELECT tb.id FROM time_buckets tb 
  WHERE tb.user_id = time_logs.user_id 
  AND tb.name = CASE time_logs.bucket
    WHEN 1 THEN 'career'
    WHEN 2 THEN 'sleep'
    WHEN 3 THEN 'maintenance'
    WHEN 4 THEN 'fitness'
    WHEN 5 THEN 'learning'
    WHEN 6 THEN 'social'
    WHEN 7 THEN 'entertainment'
    WHEN 8 THEN 'personal-dev'
  END
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`achievement_key` text NOT NULL,
	`unlocked_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `time_logs` DROP COLUMN `bucket`;