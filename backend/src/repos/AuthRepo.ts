import { v4 as uuidv4 } from "uuid";
import { DrizzleDb } from "../db";
import { UserDAL } from "../data-access-layer/UserDAL";
import { ApiKeyDAL } from "../data-access-layer/ApiKeyDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import { AppConstants } from "../config/Constants";
import { AuthSyncRepoRequest, AuthSyncResponse, MoneyCategoryTypeEnum } from "../schemas";

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "food-groceries", display_label: "Food & Groceries", color: "#10b981" },
  { name: "eating-out", display_label: "Eating Out", color: "#f59e0b" },
  { name: "transport", display_label: "Transport", color: "#6366f1" },
  { name: "shopping", display_label: "Shopping", color: "#ec4899" },
  { name: "entertainment", display_label: "Entertainment", color: "#8b5cf6" },
  { name: "health", display_label: "Health", color: "#ef4444" },
  { name: "subscriptions", display_label: "Subscriptions", color: "#0ea5e9" },
  { name: "utilities", display_label: "Utilities", color: "#14b8a6" },
  { name: "other", display_label: "Other", color: "#94a3b8" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "salary", display_label: "Salary", color: "#10b981" },
  { name: "transfer", display_label: "Transfer", color: "#6366f1" },
  { name: "refund", display_label: "Refund", color: "#f59e0b" },
  { name: "freelance", display_label: "Freelance", color: "#8b5cf6" },
  { name: "gift", display_label: "Gift", color: "#ec4899" },
  { name: "opening_balance", display_label: "Opening Balance", color: "#64748b" },
  { name: "other", display_label: "Other", color: "#94a3b8" },
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
