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

ALTER TABLE investment_cash_flows ADD COLUMN transfer_type TEXT;

-- Backfill transfer_type on old investment cashflow rows created by recurring cron
-- Positive amount with wallet_id = wallet paid into asset (wallet_to_asset)
-- Negative amount with wallet_id = asset paid into wallet (asset_to_wallet)
UPDATE investment_cash_flows
SET transfer_type = CASE
  WHEN amount >= 0 THEN 'wallet_to_asset'
  ELSE 'asset_to_wallet'
END
WHERE wallet_id IS NOT NULL AND transfer_type IS NULL;

-- Delete orphan expense_logs rows created by old cron for wallet→asset transfers
-- Match: same date, amount, wallet_id, description as a wallet_to_asset cashflow
DELETE FROM expense_logs
WHERE id IN (
  SELECT e.id
  FROM expense_logs e
  INNER JOIN investment_cash_flows icf
    ON icf.transfer_type = 'wallet_to_asset'
    AND icf.date = e.date
    AND icf.amount = e.amount
    AND icf.wallet_id = e.wallet_id
    AND (
      (icf.description IS NULL AND e.description IS NULL)
      OR icf.description = e.description
    )
);

-- Delete orphan deposit_logs rows created by old cron for asset→wallet transfers
-- Match: same date, wallet_id, description as an asset_to_wallet cashflow
-- (amounts differ: cashflow stores -principalReduction, deposit stores transferAmount)
DELETE FROM deposit_logs
WHERE id IN (
  SELECT d.id
  FROM deposit_logs d
  INNER JOIN investment_cash_flows icf
    ON icf.transfer_type = 'asset_to_wallet'
    AND icf.date = d.date
    AND icf.wallet_id = d.wallet_id
    AND (
      (icf.description IS NULL AND d.description IS NULL)
      OR icf.description = d.description
    )
);
