-- Add started_at and ended_at as full ISO 8601 timestamps
ALTER TABLE time_logs ADD COLUMN started_at TEXT;
ALTER TABLE time_logs ADD COLUMN ended_at TEXT;

-- Backfill: combine existing date + start_time/end_time into ISO timestamps
-- start_time and end_time are stored as "YYYY-MM-DDTHH:MM:SS"
-- Extract just HH:MM:SS part (chars after T) and combine with date
UPDATE time_logs
SET
  started_at = date || 'T' || substr(start_time, 12),
  ended_at   = date || 'T' || substr(end_time, 12)
WHERE started_at IS NULL;

-- Make non-nullable now that backfill is done
-- SQLite doesn't support ALTER COLUMN, so we recreate via a new table
CREATE TABLE time_logs_new (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT    NOT NULL REFERENCES users(id),
  bucket_id  INTEGER NOT NULL REFERENCES time_buckets(id),
  activity   TEXT    NOT NULL,
  started_at TEXT    NOT NULL,
  ended_at   TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

INSERT INTO time_logs_new (id, user_id, bucket_id, activity, started_at, ended_at, created_at, deleted_at)
SELECT id, user_id, bucket_id, activity, started_at, ended_at, created_at, deleted_at
FROM time_logs;

DROP TABLE time_logs;
ALTER TABLE time_logs_new RENAME TO time_logs;
