ALTER TABLE recurring_transactions ADD COLUMN to_wallet_id INTEGER REFERENCES wallets(id);
ALTER TABLE recurring_transactions ADD COLUMN asset_id INTEGER REFERENCES investment_assets(id);
ALTER TABLE recurring_transactions ADD COLUMN from_asset_id INTEGER REFERENCES investment_assets(id);
-- SQLite cannot ALTER COLUMN to remove NOT NULL. Drizzle ORM handles nullability at the ORM layer.
-- Existing rows retain their category_id values. New transfer rows may have NULL category_id.
