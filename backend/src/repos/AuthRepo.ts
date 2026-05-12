import { v4 as uuidv4 } from "uuid";
import { DrizzleDb } from "../db";
import { UserDAL } from "../data-access-layer/UserDAL";
import { ApiKeyDAL } from "../data-access-layer/ApiKeyDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import { AppConstants } from "../config/Constants";
import { AuthSyncRepoRequest, AuthSyncResponse, MoneyCategoryTypeEnum } from "../schemas";

const P = AppConstants.PALETTE;

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "food-groceries", display_label: "Food & Groceries", color: P[7] },
  { name: "eating-out", display_label: "Eating Out", color: P[5] },
  { name: "transport", display_label: "Transport", color: P[8] },
  { name: "shopping", display_label: "Shopping", color: P[2] },
  { name: "entertainment", display_label: "Entertainment", color: P[1] },
  { name: "health", display_label: "Health", color: P[3] },
  { name: "subscriptions", display_label: "Subscriptions", color: P[0] },
  { name: "utilities", display_label: "Utilities", color: P[6] },
  { name: "other", display_label: "Other", color: P[9] },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "salary", display_label: "Salary", color: P[7] },
  { name: "transfer", display_label: "Transfer", color: P[8] },
  { name: "refund", display_label: "Refund", color: P[5] },
  { name: "freelance", display_label: "Freelance", color: P[1] },
  { name: "gift", display_label: "Gift", color: P[2] },
  { name: "opening_balance", display_label: "Opening Balance", color: P[9] },
  { name: "other", display_label: "Other", color: P[9] },
];

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

    // Seed default categories for new users
    const existingCats = await MoneyCategoryDAL.findAll(user.id, db);
    if (existingCats.length === 0) {
      for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
        await MoneyCategoryDAL.insert({ userId: user.id, ...cat, type: MoneyCategoryTypeEnum.Expense }, db);
      }
      for (const cat of DEFAULT_INCOME_CATEGORIES) {
        await MoneyCategoryDAL.insert({ userId: user.id, ...cat, type: MoneyCategoryTypeEnum.Income }, db);
      }
    }

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
