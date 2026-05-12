ALTER TABLE `time_buckets` ADD `is_archived` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `time_logs` ADD `deleted_at` text;