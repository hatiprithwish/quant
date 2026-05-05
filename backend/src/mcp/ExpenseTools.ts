import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DrizzleDb } from "../db";
import { ExpenseRepo } from "../repos/ExpenseRepo";
import { ZExpenseCategoryLabelEnum } from "../schemas";
import { AppConstants } from "../config/Constants";
import { WalletDAL } from "../data-access-layer/WalletDAL";

export function registerExpenseTools(
  server: McpServer,
  userId: string,
  db: DrizzleDb,
) {
  server.tool(
    "log_expense",
    "Log one or more expenses in a single call.",
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
            category: ZExpenseCategoryLabelEnum.describe(
              `Expense category. Valid values: ${AppConstants.EXPENSE_CATEGORIES.join(", ")}`,
            ),
            description: z.string().optional().describe("What was purchased"),
            wallet_id: z
              .number()
              .int()
              .positive()
              .optional()
              .describe("Wallet ID to debit. Call list_wallets first to get valid IDs."),
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
      category: ZExpenseCategoryLabelEnum.optional().describe(
        "Optional: filter by a specific category",
      ),
    },
    async ({ start_date, end_date, category }) => {
      const result = await ExpenseRepo.getSummary(
        { from: start_date, to: end_date, category, userId },
        db,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "list_expense_categories",
    "List all valid expense category values.",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: AppConstants.EXPENSE_CATEGORIES.join(", "),
        },
      ],
    }),
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
