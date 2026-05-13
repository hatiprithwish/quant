ALTER TABLE `debt_repayments` ADD `wallet_id` integer REFERENCES wallets(id);--> statement-breakpoint
ALTER TABLE `debts` ADD `wallet_id` integer REFERENCES wallets(id);