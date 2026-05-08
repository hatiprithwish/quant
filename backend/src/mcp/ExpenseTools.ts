import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DrizzleDb } from "../db";
import { ExpenseRepo } from "../repos/ExpenseRepo";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import { MoneyCategoryTypeEnum } from "../schemas";
import { WalletDAL } from "../data-access-layer/WalletDAL";

export function registerExpenseTools(
  server: McpServer,
  userId: string,
  db: DrizzleDb,
) {
  server.tool(
    "log_expense",
    "Log one or more expenses in a single call. IMPORTANT: Always call list_money_categories first to get valid category IDs for type 'expense'. Always call list_wallets first to get valid wallet IDs. Never omit wallet_id — always debit the correct wallet.",
    {
      entries: z
        .array(
          z.object({
            date: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .describe("Date in YYYY-MM-DD format"),
            amount: z.number().positive().describe("Amount spent"),
            currency: z
              .string()
              .default("INR")
              .describe("Currency code (default INR)"),
            category_id: z
              .number()
              .int()
              .positive()
              .describe("Category ID (integer). Call list_money_categories first to resolve the correct ID."),
            description: z.string().optional().describe("What was purchased"),
            wallet_id: z
              .number()
              .int()
              .positive()
              .optional()
              .describe("Wallet ID to debit (integer). REQUIRED unless user explicitly says no wallet. Call list_wallets first — never guess or omit this."),
          }),
        )
        .min(1)
        .describe("List of expenses to log"),
    },
    async ({ entries }) => {
      const result = await ExpenseRepo.logExpense({ entries, userId }, db);
      return {
        content: [
          {
            type: "text",
            text: `Logged ${result.insertedCount} expense(s).`,
          },
        ],
      };
    },
  );

  server.tool(
    "get_expense_summary",
    "Get expense summary for a date range, broken down by day and by category.",
    {
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Start date YYYY-MM-DD (inclusive)"),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("End date YYYY-MM-DD (inclusive)"),
      category_id: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Optional: filter by a specific category ID"),
    },
    async ({ start_date, end_date, category_id }) => {
      const result = await ExpenseRepo.getSummary(
        { from: start_date, to: end_date, category_id, userId },
        db,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "list_money_categories",
    "List all money categories for the user. Returns id, name, display_label, color, and type ('expense' or 'income'). Call this before log_expense or log_income to resolve the correct category_id.",
    {
      type: z
        .enum(["expense", "income"])
        .optional()
        .describe("Filter by type. Omit to get all categories."),
    },
    async ({ type }) => {
      const cats = type
        ? await MoneyCategoryDAL.findByType(userId, type as MoneyCategoryTypeEnum, db)
        : await MoneyCategoryDAL.findAll(userId, db);
      return {
        content: [{ type: "text", text: JSON.stringify(cats, null, 2) }],
      };
    },
  );

  server.tool(
    "list_wallets",
    "List all active wallets with their IDs, names, types, and current balances. Call this before log_expense to resolve the correct wallet_id.",
    {},
    async () => {
      const walletList = await WalletDAL.findAllWithBalance({ userId }, db);
      return {
        content: [{ type: "text", text: JSON.stringify(walletList, null, 2) }],
      };
    },
  );
}
