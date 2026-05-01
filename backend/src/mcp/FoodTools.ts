import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DrizzleDb } from "../db";
import { FoodRepo } from "../repos/FoodRepo";
import { ZMealTypeLabelEnum } from "../schemas";

const ZFoodItemInput = z.object({
  name: z.string().describe("Food item name"),
  calories: z.number().int().min(0).describe("Calories in this item"),
  amount: z.number().positive().optional().describe("Amount consumed"),
  unit: z.string().optional().describe("Unit (g, ml, piece, etc.)"),
  protein_g: z.number().min(0).optional().describe("Protein in grams"),
  carb_g: z.number().min(0).optional().describe("Carbohydrates in grams"),
  fat_g: z.number().min(0).optional().describe("Fat in grams"),
});

export function registerFoodTools(
  server: McpServer,
  userId: string,
  db: DrizzleDb,
) {
  server.tool(
    "log_meal",
    "Log one or more food items for a meal. Each item in a meal is logged separately but grouped by meal_type.",
    {
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Date in YYYY-MM-DD format"),
      meal_type: ZMealTypeLabelEnum.describe(
        "Meal type: breakfast, lunch, dinner, or snack",
      ),
      items: z
        .array(ZFoodItemInput)
        .min(1)
        .describe("List of food items consumed in this meal"),
    },
    async ({ date, meal_type, items }) => {
      const result = await FoodRepo.logMeal(
        { date, meal_type, items, userId },
        db,
      );
      return {
        content: [
          {
            type: "text",
            text: `Logged ${result.insertedCount} item(s) for ${meal_type} on ${date}.`,
          },
        ],
      };
    },
  );

  server.tool(
    "get_food_summary",
    "Get food and nutrition summary for a date range. Returns daily totals and per-meal breakdowns with macro nutrients.",
    {
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Start date YYYY-MM-DD (inclusive)"),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("End date YYYY-MM-DD (inclusive)"),
    },
    async ({ start_date, end_date }) => {
      const result = await FoodRepo.getSummary(
        { from: start_date, to: end_date, userId },
        db,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
