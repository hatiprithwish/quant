# Investments Feature — Design Spec

**Date:** 2026-05-09  
**Status:** Approved

---

## Overview

New "Investments" tab in the Money page. Tracks investment accounts (e.g. Coin, U.S. Stocks, Smallcase, Mutual Funds), assets within each account, cash flows into assets, and manually-updated current values. Computes XIRR per asset and rolls up to account level.

Dashboard-only. No MCP server integration.

---

## Screens

### 1. Investments Overview (tab root)
- Portfolio summary card: total current value, total invested, overall XIRR
- Account list: each row shows account name, current value, XIRR %
- "+ Add Account" button
- Click account row → Account Detail

### 2. Account Detail
- Back nav → Overview
- Account stats row: total value, total invested, XIRR
- Graph: account value vs invested amount over time (two lines; x = date, y = ₹). Data points = sum of asset snapshots per date.
- Asset list: each row shows asset name, current value, XIRR %
- "+ Add Asset" button
- Click asset row → Asset Detail

### 3. Asset Detail
- Back nav → Account Detail
- Stats row: current value (with date last updated), total invested, XIRR
- XIRR has ⓘ tooltip: "XIRR computed as of last current value update"
- "Edit Current Value" button → modal: enter new value, saves snapshot with today's date
- Cash flow list: each row shows date, source (wallet name or "Direct"), amount
- "+ Add Investment" button → modal: amount, date, wallet (optional dropdown)

---

## Data Model

```sql
investment_accounts (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL
)

investment_assets (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES investment_accounts(id),
  name        TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL
)

investment_cash_flows (
  id              TEXT PRIMARY KEY,
  asset_id        TEXT NOT NULL REFERENCES investment_assets(id),
  amount          REAL NOT NULL,
  date            DATE NOT NULL,
  wallet_id       TEXT REFERENCES wallets(id),       -- null = direct investment
  transaction_id  TEXT REFERENCES transactions(id),  -- null = direct investment
  created_at      TIMESTAMP NOT NULL
)

asset_value_snapshots (
  id            TEXT PRIMARY KEY,
  asset_id      TEXT NOT NULL REFERENCES investment_assets(id),
  value         REAL NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at    TIMESTAMP NOT NULL
)
```

---

## Cash Flow Sources

**Wallet transfer:**
- Creates 1 row in `transactions` (type: `investment`, debit from wallet)
- Creates 1 row in `investment_cash_flows` (wallet_id + transaction_id set)
- Wallet transfer appears in existing Transactions tab automatically

**Direct investment (no wallet):**
- Creates 1 row in `investment_cash_flows` only (wallet_id = null, transaction_id = null)
- Does NOT appear in Transactions tab

---

## XIRR Computation

Standard XIRR algorithm:

- Cash outflows (negative): each row in `investment_cash_flows` for the asset, dated by `date`
- Cash inflow (positive): latest `asset_value_snapshots` row for the asset, dated by `snapshot_date`
- Computed per asset
- Account-level XIRR: re-run XIRR over all cash flows across all assets in account, using sum of latest snapshots as terminal value
- Portfolio-level XIRR: same, across all accounts

XIRR requires at least one cash flow and one snapshot. Show "—" if insufficient data.

---

## Graph Data

- Per account: for each date where any asset in the account has a snapshot, sum all asset snapshot values → "current value" data point. Sum all cash flows up to that date → "invested" data point.
- Portfolio graph: same logic across all accounts.
- Render two lines: current value (colored) + invested amount (muted).

---

## SIP / Recurring Investments

Not a new feature. Handled by existing recurring transactions system. User creates a recurring transaction from a wallet to a specific asset on a schedule (e.g. 10th of every month). Each firing creates a cash flow row normally.

---

## Out of Scope

- MCP server integration
- Automatic price fetching / market data
- Asset sell / withdrawal flows (invest-only for now)
- Multi-currency support
