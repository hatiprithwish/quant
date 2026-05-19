import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { foodLogs } from "../db/tables";
import { InsertFoodLogDbRequest, GetFoodLogsDbRequest } from "../schemas";
import { AppConstants } from "../config/Constants";

export class FoodDAL {
  static async insertMany(
    items: InsertFoodLogDbRequest[],
    db: DrizzleDb,
  ): Promise<void> {
    const chunkSize = AppConstants.D1_INSERT_CHUNK_SIZES.FOOD;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await db.insert(foodLogs).values(
        chunk.map((item) => ({
          user_id: item.userId,
          date: item.date,
          meal_type: item.mealType,
          item_name: item.itemName,
          amount: item.amount,
          unit: item.unit,
          calories: item.calories,
          protein_g: item.proteinG,
          carb_g: item.carbG,
          fat_g: item.fatG,
        })),
      );
    }
  }

  static async deleteByDate(userId: string, date: string, db: DrizzleDb) {
    return db.delete(foodLogs).where(and(eq(foodLogs.user_id, userId), eq(foodLogs.date, date)));
  }

  static async findByDateRange(req: GetFoodLogsDbRequest, db: DrizzleDb) {
    return db
      .select()
      .from(foodLogs)
      .where(
        and(
          eq(foodLogs.user_id, req.userId),
          between(foodLogs.date, req.from, req.to),
        ),
      )
      .orderBy(foodLogs.date, foodLogs.meal_type);
  }
}
