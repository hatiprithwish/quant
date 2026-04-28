import { eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { users } from "../db/schema";

export interface UpsertUserDbRequest {
  id: string;
  clerkUserId: string;
  email: string;
}

export class UserDAL {
  static async findByClerkId(
    clerkUserId: string,
    db: DrizzleDb
  ) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.clerk_user_id, clerkUserId))
      .limit(1);
    return result[0] ?? null;
  }

  static async upsert(req: UpsertUserDbRequest, db: DrizzleDb) {
    await db
      .insert(users)
      .values({
        id: req.id,
        clerk_user_id: req.clerkUserId,
        email: req.email,
      })
      .onConflictDoUpdate({
        target: users.clerk_user_id,
        set: {
          email: req.email,
          updated_at: new Date().toISOString(),
        },
      });

    return db
      .select()
      .from(users)
      .where(eq(users.clerk_user_id, req.clerkUserId))
      .limit(1)
      .then((r) => r[0]);
  }
}
