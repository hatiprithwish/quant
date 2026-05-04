import { eq, and } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { oauthAuthCodes } from "../db/tables";

export class OAuthDAL {
  static async insertAuthCode(
    req: {
      id: string;
      userId: string;
      code: string;
      redirectUri: string;
      codeChallenge: string;
      codeChallengeMethod: string;
      expiresAt: string;
    },
    db: DrizzleDb,
  ) {
    await db.insert(oauthAuthCodes).values({
      id: req.id,
      user_id: req.userId,
      code: req.code,
      redirect_uri: req.redirectUri,
      code_challenge: req.codeChallenge,
      code_challenge_method: req.codeChallengeMethod,
      expires_at: req.expiresAt,
    });
    return db
      .select()
      .from(oauthAuthCodes)
      .where(eq(oauthAuthCodes.id, req.id))
      .limit(1)
      .then((r) => r[0]);
  }

  static async findAuthCode(code: string, db: DrizzleDb) {
    const result = await db
      .select()
      .from(oauthAuthCodes)
      .where(and(eq(oauthAuthCodes.code, code), eq(oauthAuthCodes.used, 0)))
      .limit(1);
    return result[0] ?? null;
  }

  static async markAuthCodeUsed(id: string, db: DrizzleDb) {
    await db
      .update(oauthAuthCodes)
      .set({ used: 1 })
      .where(eq(oauthAuthCodes.id, id));
  }
}
