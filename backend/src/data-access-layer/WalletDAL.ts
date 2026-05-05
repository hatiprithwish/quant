import { and, eq, or, sql } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { wallets, depositLogs, expenseLogs, transferLogs } from "../db/tables";
import {
  GetWalletsDbRequest,
  InsertWalletDbRequest,
  UpdateWalletDbRequest,
  WalletTypeEnum,
} from "../schemas";

export class WalletDAL {
  static async findAllWithBalance(req: GetWalletsDbRequest, db: DrizzleDb) {
    return db
      .select({
        id: wallets.id,
        name: wallets.name,
        type: wallets.type,
        credit_limit: wallets.credit_limit,
        active: wallets.active,
        balance: sql<number>`
          COALESCE((
            SELECT SUM(d.amount)
            FROM ${depositLogs} d
            WHERE d.wallet_id = ${wallets.id}
          ), 0)
          +
          COALESCE((
            SELECT SUM(t.amount)
            FROM ${transferLogs} t
            WHERE t.to_wallet_id = ${wallets.id}
          ), 0)
          -
          COALESCE((
            SELECT SUM(e.amount)
            FROM ${expenseLogs} e
            WHERE e.wallet_id = ${wallets.id}
          ), 0)
          -
          COALESCE((
            SELECT SUM(t.amount)
            FROM ${transferLogs} t
            WHERE t.from_wallet_id = ${wallets.id}
          ), 0)
        `.as("balance"),
      })
      .from(wallets)
      .where(and(eq(wallets.user_id, req.userId), eq(wallets.active, 1)));
  }

  static async findById(id: number, userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.user_id, userId)));
    return rows[0] ?? null;
  }

  static async insert(req: InsertWalletDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(wallets)
      .values({
        user_id: req.userId,
        name: req.name,
        type: req.type as WalletTypeEnum,
        credit_limit: req.credit_limit,
      })
      .returning();
    return rows[0];
  }

  static async update(
    id: number,
    userId: string,
    req: UpdateWalletDbRequest,
    db: DrizzleDb,
  ) {
    const patch: Record<string, unknown> = {};
    if (req.name !== undefined) patch.name = req.name;
    if (req.type !== undefined) patch.type = req.type;
    if (req.credit_limit !== undefined) patch.credit_limit = req.credit_limit;

    const rows = await db
      .update(wallets)
      .set(patch)
      .where(and(eq(wallets.id, id), eq(wallets.user_id, userId)))
      .returning();
    return rows[0] ?? null;
  }

  static async softDelete(id: number, userId: string, db: DrizzleDb) {
    await db
      .update(wallets)
      .set({ active: 0 })
      .where(and(eq(wallets.id, id), eq(wallets.user_id, userId)));
  }

  static async countLinkedRecords(id: number, db: DrizzleDb): Promise<number> {
    const [expCount] = await db
      .select({ c: sql<number>`COUNT(*)` })
      .from(expenseLogs)
      .where(eq(expenseLogs.wallet_id, id));

    const [depCount] = await db
      .select({ c: sql<number>`COUNT(*)` })
      .from(depositLogs)
      .where(eq(depositLogs.wallet_id, id));

    const [txCount] = await db
      .select({ c: sql<number>`COUNT(*)` })
      .from(transferLogs)
      .where(
        or(
          eq(transferLogs.from_wallet_id, id),
          eq(transferLogs.to_wallet_id, id),
        ),
      );

    return (
      Number(expCount?.c ?? 0) +
      Number(depCount?.c ?? 0) +
      Number(txCount?.c ?? 0)
    );
  }
}
