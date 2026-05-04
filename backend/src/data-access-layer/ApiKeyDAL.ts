import { eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { apiKeys } from "../db/tables";

export class ApiKeyDAL {
  static async findByUserId(userId: string, db: DrizzleDb) {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.user_id, userId))
      .limit(1);
    return result[0] ?? null;
  }

  static async getUserIdByKey(
    key: string,
    db: DrizzleDb,
  ): Promise<string | null> {
    const result = await db
      .select({ user_id: apiKeys.user_id })
      .from(apiKeys)
      .where(eq(apiKeys.key, key))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return row.user_id;
  }

  static async insert(
    req: { id: string; userId: string; key: string },
    db: DrizzleDb,
  ) {
    await db.insert(apiKeys).values({
      id: req.id,
      user_id: req.userId,
      key: req.key,
    });

    return db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, req.id))
      .limit(1)
      .then((r) => r[0]);
  }
}
