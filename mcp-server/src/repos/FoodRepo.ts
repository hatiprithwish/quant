import { DrizzleDb } from "../db";
import { FoodDAL } from "../data-access-layer/FoodDAL";
import {
  LogMealRepoRequest,
  FoodQueryRepoRequest,
  mealTypeLabelToInt,
  mealTypeIntToLabel,
  MealTypeIntEnum,
  GetFoodSummaryResponse,
  LogMealResponse,
  DailyFoodSummary,
  MealSummary,
  FoodItem,
} from "../schemas";

export class FoodRepo {
  static async logMeal(
    req: LogMealRepoRequest,
    db: DrizzleDb,
  ): Promise<LogMealResponse> {
    const mealTypeInt = mealTypeLabelToInt[req.meal_type];

    await FoodDAL.insertMany(
      req.items.map((item) => ({
        userId: req.userId,
        date: req.date,
        mealType: mealTypeInt,
        itemName: item.name,
        amount: item.amount ?? null,
        unit: item.unit ?? null,
        calories: item.calories,
        proteinG: item.protein_g ?? 0,
        carbG: item.carb_g ?? 0,
        fatG: item.fat_g ?? 0,
      })),
      db,
    );

    return {
      isSuccess: true,
      message: `Logged ${req.items.length} food item(s)`,
      insertedCount: req.items.length,
    };
  }

  static async getSummary(
    req: FoodQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetFoodSummaryResponse> {
    const rows = await FoodDAL.findByDateRange(
      { userId: req.userId, from: req.from, to: req.to },
      db,
    );

    const dayMap = new Map<
      string,
      Map<
        MealTypeIntEnum,
        {
          items: FoodItem[];
          cals: number;
          prot: number;
          carb: number;
          fat: number;
        }
      >
    >();

    for (const row of rows) {
      if (!dayMap.has(row.date)) {
        dayMap.set(row.date, new Map());
      }
      const mealMap = dayMap.get(row.date)!;
      if (!mealMap.has(row.meal_type)) {
        mealMap.set(row.meal_type, {
          items: [],
          cals: 0,
          prot: 0,
          carb: 0,
          fat: 0,
        });
      }
      const meal = mealMap.get(row.meal_type)!;
      meal.cals += row.calories;
      meal.prot += row.protein_g;
      meal.carb += row.carb_g;
      meal.fat += row.fat_g;
      meal.items.push({
        name: row.item_name,
        calories: row.calories,
        amount: row.amount ?? undefined,
        unit: row.unit ?? undefined,
        protein_g: row.protein_g,
        carb_g: row.carb_g,
        fat_g: row.fat_g,
      });
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarb = 0;
    let totalFat = 0;

    const days: DailyFoodSummary[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, mealMap]) => {
        const meals: MealSummary[] = Array.from(mealMap.entries()).map(
          ([mealTypeInt, data]) => ({
            date,
            meal_type: mealTypeIntToLabel[mealTypeInt],
            total_calories: data.cals,
            total_protein_g: data.prot,
            total_carb_g: data.carb,
            total_fat_g: data.fat,
            items: data.items,
          }),
        );

        const dayCalories = meals.reduce((s, m) => s + m.total_calories, 0);
        const dayProtein = meals.reduce((s, m) => s + m.total_protein_g, 0);
        const dayCarb = meals.reduce((s, m) => s + m.total_carb_g, 0);
        const dayFat = meals.reduce((s, m) => s + m.total_fat_g, 0);

        totalCalories += dayCalories;
        totalProtein += dayProtein;
        totalCarb += dayCarb;
        totalFat += dayFat;

        return {
          date,
          total_calories: dayCalories,
          total_protein_g: dayProtein,
          total_carb_g: dayCarb,
          total_fat_g: dayFat,
          meals,
        };
      });

    return {
      isSuccess: true,
      message: "Food summary retrieved",
      days,
      totalCalories,
      totalProtein_g: totalProtein,
      totalCarb_g: totalCarb,
      totalFat_g: totalFat,
    };
  }
}
