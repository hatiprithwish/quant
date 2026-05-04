import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { foodLogs } from "../db/tables";
import { InsertFoodLogDbRequest, GetFoodLogsDbRequest } from "../schemas";

export class FoodDAL {
  static async insertMany(
    items: InsertFoodLogDbRequest[],
    db: DrizzleDb,
  ): Promise<void> {
    await db.insert(foodLogs).values(
      items.map((item) => ({
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
