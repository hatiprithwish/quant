import { eq, like, or, sql } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { foodItems } from "../db/tables";
import { InsertFoodItemDbRequest, UpdateFoodItemDbRequest } from "../schemas";
import { FoodItemReviewStatusEnum } from "../schemas";

export class FoodItemsDAL {
  static async findByKeyword(keyword: string, db: DrizzleDb) {
    const pattern = `%${keyword.toLowerCase()}%`;
    return db
      .select()
      .from(foodItems)
      .where(
        or(
          like(sql`lower(${foodItems.name})`, pattern),
          like(foodItems.keywords, pattern),
        ),
      )
      .limit(5);
  }

  static async findById(id: number, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  static async findPending(db: DrizzleDb) {
    return db
      .select()
      .from(foodItems)
      .where(eq(foodItems.review_status, FoodItemReviewStatusEnum.Pending))
      .orderBy(foodItems.created_at);
  }

  static async findAll(db: DrizzleDb) {
    return db.select().from(foodItems).orderBy(foodItems.created_at);
  }

  static async insert(req: InsertFoodItemDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(foodItems)
      .values({
        name: req.name,
        keywords: JSON.stringify(req.keywords),
        is_branded: req.isBranded ? 1 : 0,
        brand: req.brand,
        is_packaged: req.isPackaged ? 1 : 0,
        ingredients: req.ingredients ? JSON.stringify(req.ingredients) : null,
        review_status: req.reviewStatus,
        source: req.source,
        calories_per_100g: req.caloriesPer100g,
        protein_g: req.proteinG,
        carb_g: req.carbG,
        fat_g: req.fatG,
        fiber_g: req.fiberG,
        sugar_g: req.sugarG,
        sodium_mg: req.sodiumMg,
        saturated_fat_g: req.saturatedFatG,
        cholesterol_mg: req.cholesterolMg,
        trans_fat_g: req.transFatG,
        potassium_mg: req.potassiumMg,
        vitamin_a_mcg: req.vitaminAMcg,
        vitamin_c_mg: req.vitaminCMg,
        vitamin_d_mcg: req.vitaminDMcg,
        vitamin_b12_mcg: req.vitaminB12Mcg,
        calcium_mg: req.calciumMg,
        iron_mg: req.ironMg,
      })
      .onConflictDoNothing()
      .returning();
    return rows[0] ?? null;
  }

  static async update(id: number, req: UpdateFoodItemDbRequest, db: DrizzleDb) {
    const patch: Record<string, unknown> = {
      updated_at: sql`(datetime('now'))`,
    };

    if (req.reviewStatus !== undefined) patch.review_status = req.reviewStatus;
    if (req.keywords !== undefined) patch.keywords = JSON.stringify(req.keywords);
    if (req.brand !== undefined) patch.brand = req.brand;
    if (req.caloriesPer100g !== undefined) patch.calories_per_100g = req.caloriesPer100g;
    if (req.proteinG !== undefined) patch.protein_g = req.proteinG;
    if (req.carbG !== undefined) patch.carb_g = req.carbG;
    if (req.fatG !== undefined) patch.fat_g = req.fatG;
    if (req.fiberG !== undefined) patch.fiber_g = req.fiberG;
    if (req.sugarG !== undefined) patch.sugar_g = req.sugarG;
    if (req.sodiumMg !== undefined) patch.sodium_mg = req.sodiumMg;

    const rows = await db
      .update(foodItems)
      .set(patch)
      .where(eq(foodItems.id, id))
      .returning();
    return rows[0] ?? null;
  }
}
