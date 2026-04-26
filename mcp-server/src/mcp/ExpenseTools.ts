import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DrizzleDb } from "../db";
import { ExpenseRepo } from "../repos/ExpenseRepo";
import { ZExpenseCategoryLabelEnum } from "../schemas";
import { AppConstants } from "../config/Constants";

export function registerExpenseTools(
  server: McpServer,
  userId: string,
  db: DrizzleDb,
) {
  server.tool(
    "log_expense",
    "Log a single expense with category, amount, and payment method.",
    {
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
      payment_method: z
        .string()
        .optional()
        .describe("Payment method (UPI, cash, card name, etc.)"),
    },
    async ({
      date,
      amount,
      currency,
      category,
      description,
      payment_method,
    }) => {
      await ExpenseRepo.logExpense(
        {
          date,
          amount,
          currency,
          category,
          description,
          payment_method,
          userId,
        },
        db,
      );
      return {
        content: [
          {
            type: "text",
            text: `Logged expense of ${currency} ${amount} (${category}) on ${date}.`,
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
}
