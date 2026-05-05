import { eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { scratchpads } from "../db/tables";

export class ScratchpadDAL {
  static async getByUserId(userId: string, db: DrizzleDb): Promise<string> {
    const rows = await db
      .select()
      .from(scratchpads)
      .where(eq(scratchpads.user_id, userId))
      .limit(1);
    return rows[0]?.content ?? "";
  }

  static async upsert(
    userId: string,
    content: string,
    db: DrizzleDb,
  ): Promise<void> {
    const existing = await db
      .select({ id: scratchpads.id })
      .from(scratchpads)
      .where(eq(scratchpads.user_id, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(scratchpads)
        .set({ content, updated_at: new Date().toISOString() })
        .where(eq(scratchpads.user_id, userId));
    } else {
      await db.insert(scratchpads).values({ user_id: userId, content });
    }
  }
}
