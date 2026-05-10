import { eq, and, isNull } from "drizzle-orm";
import { DrizzleDb } from "../db";
import {
  investmentAccounts,
  investmentAssets,
  investmentCashFlows,
  assetValueSnapshots,
  wallets,
} from "../db/tables";
import {
  CreateInvestmentAccountDbRequest,
  UpdateInvestmentAccountDbRequest,
  CreateInvestmentAssetDbRequest,
  UpdateInvestmentAssetDbRequest,
  AddCashFlowDbRequest,
  AddValueSnapshotDbRequest,
} from "../schemas";

export class InvestmentDAL {
  static async findAccountsByUserId(userId: string, db: DrizzleDb) {
    return db
      .select()
      .from(investmentAccounts)
      .where(and(eq(investmentAccounts.user_id, userId), isNull(investmentAccounts.deleted_at)));
  }

  static async findAccountById(id: number, userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(investmentAccounts)
      .where(and(eq(investmentAccounts.id, id), eq(investmentAccounts.user_id, userId), isNull(investmentAccounts.deleted_at)));
    return rows[0] ?? null;
  }

  static async createAccount(req: CreateInvestmentAccountDbRequest, db: DrizzleDb) {
    const result = await db
      .insert(investmentAccounts)
      .values({ user_id: req.userId, name: req.name })
      .returning();
    return result[0];
  }

  static async updateAccount(req: UpdateInvestmentAccountDbRequest, db: DrizzleDb) {
    const result = await db
      .update(investmentAccounts)
      .set({ ...(req.name !== undefined && { name: req.name }) })
      .where(and(eq(investmentAccounts.id, req.id), eq(investmentAccounts.user_id, req.userId)))
      .returning();
    return result[0] ?? null;
  }

  static async softDeleteAccount(id: number, userId: string, db: DrizzleDb) {
    return db
      .update(investmentAccounts)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(investmentAccounts.id, id), eq(investmentAccounts.user_id, userId)));
  }

  static async findAssetsByAccountId(accountId: number, db: DrizzleDb) {
    return db
      .select()
      .from(investmentAssets)
      .where(and(eq(investmentAssets.account_id, accountId), isNull(investmentAssets.deleted_at)));
  }

  static async findAssetById(id: number, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(investmentAssets)
      .where(and(eq(investmentAssets.id, id), isNull(investmentAssets.deleted_at)));
    return rows[0] ?? null;
  }

  static async createAsset(req: CreateInvestmentAssetDbRequest, db: DrizzleDb) {
    const result = await db
      .insert(investmentAssets)
      .values({ account_id: req.accountId, name: req.name })
      .returning();
    return result[0];
  }

  static async updateAsset(req: UpdateInvestmentAssetDbRequest, db: DrizzleDb) {
    const result = await db
      .update(investmentAssets)
      .set({ ...(req.name !== undefined && { name: req.name }) })
      .where(eq(investmentAssets.id, req.id))
      .returning();
    return result[0] ?? null;
  }

  static async softDeleteAsset(id: number, db: DrizzleDb) {
    return db
      .update(investmentAssets)
      .set({ deleted_at: new Date().toISOString() })
      .where(eq(investmentAssets.id, id));
  }

  static async findCashFlowsByAssetId(assetId: number, db: DrizzleDb) {
    return db
      .select({
        id: investmentCashFlows.id,
        amount: investmentCashFlows.amount,
        date: investmentCashFlows.date,
        wallet_id: investmentCashFlows.wallet_id,
        wallet_name: wallets.name,
        description: investmentCashFlows.description,
      })
      .from(investmentCashFlows)
      .leftJoin(wallets, eq(investmentCashFlows.wallet_id, wallets.id))
      .where(eq(investmentCashFlows.asset_id, assetId));
  }

  static async findCashFlowsByAssetIds(assetIds: number[], db: DrizzleDb) {
    if (assetIds.length === 0) return [];
    const { inArray } = await import("drizzle-orm");
    return db
      .select({
        id: investmentCashFlows.id,
        asset_id: investmentCashFlows.asset_id,
        amount: investmentCashFlows.amount,
        date: investmentCashFlows.date,
        wallet_id: investmentCashFlows.wallet_id,
        wallet_name: wallets.name,
        description: investmentCashFlows.description,
      })
      .from(investmentCashFlows)
      .leftJoin(wallets, eq(investmentCashFlows.wallet_id, wallets.id))
      .where(inArray(investmentCashFlows.asset_id, assetIds));
  }

  static async addCashFlow(req: AddCashFlowDbRequest, db: DrizzleDb) {
    const result = await db
      .insert(investmentCashFlows)
      .values({
        asset_id: req.assetId,
        amount: req.amount,
        date: req.date,
        wallet_id: req.walletId ?? null,
        description: req.description ?? null,
      })
      .returning();
    return result[0];
  }

  static async deleteCashFlow(id: number, db: DrizzleDb) {
    return db.delete(investmentCashFlows).where(eq(investmentCashFlows.id, id));
  }

  static async findSnapshotsByAssetId(assetId: number, db: DrizzleDb) {
    return db
      .select()
      .from(assetValueSnapshots)
      .where(eq(assetValueSnapshots.asset_id, assetId));
  }

  static async findSnapshotsByAssetIds(assetIds: number[], db: DrizzleDb) {
    if (assetIds.length === 0) return [];
    const { inArray } = await import("drizzle-orm");
    return db
      .select()
      .from(assetValueSnapshots)
      .where(inArray(assetValueSnapshots.asset_id, assetIds));
  }

  static async addSnapshot(req: AddValueSnapshotDbRequest, db: DrizzleDb) {
    const result = await db
      .insert(assetValueSnapshots)
      .values({
        asset_id: req.assetId,
        value: req.value,
        snapshot_date: req.snapshotDate,
      })
      .returning();
    return result[0];
  }

  static async findAssetWithLatestSnapshot(id: number, db: DrizzleDb) {
    const assetRows = await db
      .select()
      .from(investmentAssets)
      .where(and(eq(investmentAssets.id, id), isNull(investmentAssets.deleted_at)));
    const asset = assetRows[0] ?? null;
    if (!asset) return null;

    const snapshots = await db
      .select()
      .from(assetValueSnapshots)
      .where(eq(assetValueSnapshots.asset_id, id))
      .orderBy(assetValueSnapshots.snapshot_date);
    const latestSnapshot = snapshots.at(-1) ?? null;

    const flows = await db
      .select()
      .from(investmentCashFlows)
      .where(eq(investmentCashFlows.asset_id, id));
    const investedAmount = flows.reduce((s, f) => s + f.amount, 0);

    return {
      ...asset,
      current_value: latestSnapshot?.value ?? null,
      latest_snapshot_date: latestSnapshot?.snapshot_date ?? null,
      invested_amount: investedAmount,
    };
  }

  static async findWalletCashFlowsByDateRange(userId: string, from: string, to: string, db: DrizzleDb) {
    const accountRows = await InvestmentDAL.findAccountsByUserId(userId, db);
    if (accountRows.length === 0) return [];
    const accountIds = accountRows.map((a) => a.id);
    const { inArray } = await import("drizzle-orm");
    const assetRows = await db
      .select()
      .from(investmentAssets)
      .where(and(inArray(investmentAssets.account_id, accountIds), isNull(investmentAssets.deleted_at)));
    if (assetRows.length === 0) return [];
    const assetIds = assetRows.map((a) => a.id);
    const assetMap = new Map(assetRows.map((a) => [a.id, a.name]));
    const { gte, lte } = await import("drizzle-orm");
    const flows = await db
      .select({
        id: investmentCashFlows.id,
        asset_id: investmentCashFlows.asset_id,
        amount: investmentCashFlows.amount,
        date: investmentCashFlows.date,
        wallet_id: investmentCashFlows.wallet_id,
        wallet_name: wallets.name,
        description: investmentCashFlows.description,
      })
      .from(investmentCashFlows)
      .leftJoin(wallets, eq(investmentCashFlows.wallet_id, wallets.id))
      .where(and(
        inArray(investmentCashFlows.asset_id, assetIds),
        gte(investmentCashFlows.date, from),
        lte(investmentCashFlows.date, to),
      ));
    return flows.filter((f) => f.wallet_id !== null).map((f) => ({
      ...f,
      asset_name: assetMap.get(f.asset_id) ?? null,
    }));
  }
}
