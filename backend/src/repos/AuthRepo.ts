import { v4 as uuidv4 } from "uuid";
import { DrizzleDb } from "../db";
import { UserDAL } from "../data-access-layer/UserDAL";
import { ApiKeyDAL } from "../data-access-layer/ApiKeyDAL";
import { AppConstants } from "../config/Constants";
import { AuthSyncRepoRequest, AuthSyncResponse } from "../schemas";

function generateApiKey(): string {
  const bytes = new Uint8Array(AppConstants.API_KEY.BYTE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class AuthRepo {
  static async syncUser(
    req: AuthSyncRepoRequest,
    db: DrizzleDb,
  ): Promise<AuthSyncResponse> {
    const user = await UserDAL.upsert(
      {
        id: uuidv4(),
        clerkUserId: req.clerkUserId,
        email: req.email,
      },
      db,
    );

    let apiKeyRow = await ApiKeyDAL.findByUserId(user.id, db);

    if (!apiKeyRow) {
      apiKeyRow = await ApiKeyDAL.insert(
        {
          id: uuidv4(),
          userId: user.id,
          key: generateApiKey(),
        },
        db,
      );
    }

    return {
      isSuccess: true,
      message: "User synced successfully",
      apiKey: apiKeyRow.key,
      userId: user.id,
    };
  }
}
