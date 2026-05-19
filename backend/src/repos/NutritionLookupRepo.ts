import { Ai } from "@cloudflare/workers-types";
import { DrizzleDb } from "../db";
import { FoodItemsDAL } from "../data-access-layer/FoodItemsDAL";
import { AppConstants } from "../config/Constants";
import { FoodItemReviewStatusEnum, FoodItemSourceEnum } from "../schemas";
import { Logger } from "../config/Logger";

interface NutritionData {
  calories_per_100g: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  saturated_fat_g: number | null;
  cholesterol_mg: number | null;
  trans_fat_g: number | null;
  potassium_mg: number | null;
  vitamin_a_mcg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  vitamin_b12_mcg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
}

export interface ResolvedFoodItem {
  canonicalName: string;
  keywords: string[];
  isBranded: boolean;
  brand: string | null;
  isPackaged: boolean;
  ingredients: string[] | null;
  source: FoodItemSourceEnum;
  nutrition: NutritionData;
  foundInDb: boolean;
  dbId: number | null;
}

export class NutritionLookupRepo {
  static async resolve(
    itemName: string,
    usdaApiKey: string,
    browser: Fetcher,
    ai: Ai,
    db: DrizzleDb,
  ): Promise<ResolvedFoodItem> {
    // Step 1: DB lookup
    const dbResult = await NutritionLookupRepo.checkDb(itemName, db);
    if (dbResult) return dbResult;

    // Step 2: USDA
    const usda = await NutritionLookupRepo.fetchUsda(itemName, usdaApiKey);
    if (usda) {
      return {
        canonicalName: itemName,
        keywords: [itemName.toLowerCase()],
        isBranded: false,
        brand: null,
        isPackaged: false,
        ingredients: null,
        source: FoodItemSourceEnum.USDA,
        nutrition: usda,
        foundInDb: false,
        dbId: null,
      };
    }

    // Step 3: OpenFoodFacts
    const off = await NutritionLookupRepo.fetchOpenFoodFacts(itemName);
    if (off) {
      return {
        canonicalName: itemName,
        keywords: [itemName.toLowerCase()],
        isBranded: false,
        brand: null,
        isPackaged: false,
        ingredients: null,
        source: FoodItemSourceEnum.OpenFoodFacts,
        nutrition: off,
        foundInDb: false,
        dbId: null,
      };
    }

    // Step 4: Browser scrape
    const scraped = await NutritionLookupRepo.scrapeWithBrowser(itemName, browser, ai);
    if (scraped) {
      return {
        canonicalName: itemName,
        keywords: [itemName.toLowerCase()],
        isBranded: true,
        brand: null,
        isPackaged: true,
        ingredients: null,
        source: FoodItemSourceEnum.Browser,
        nutrition: scraped,
        foundInDb: false,
        dbId: null,
      };
    }

    // Step 5: AI estimation (always succeeds)
    return NutritionLookupRepo.estimateWithAi(itemName, ai);
  }

  static async saveToDb(resolved: ResolvedFoodItem, db: DrizzleDb): Promise<number | null> {
    const row = await FoodItemsDAL.insert(
      {
        name: resolved.canonicalName,
        keywords: resolved.keywords,
        isBranded: resolved.isBranded,
        brand: resolved.brand,
        isPackaged: resolved.isPackaged,
        ingredients: resolved.ingredients,
        reviewStatus: FoodItemReviewStatusEnum.Pending,
        source: resolved.source,
        caloriesPer100g: resolved.nutrition.calories_per_100g,
        proteinG: resolved.nutrition.protein_g,
        carbG: resolved.nutrition.carb_g,
        fatG: resolved.nutrition.fat_g,
        fiberG: resolved.nutrition.fiber_g,
        sugarG: resolved.nutrition.sugar_g,
        sodiumMg: resolved.nutrition.sodium_mg,
        saturatedFatG: resolved.nutrition.saturated_fat_g,
        cholesterolMg: resolved.nutrition.cholesterol_mg,
        transFatG: resolved.nutrition.trans_fat_g,
        potassiumMg: resolved.nutrition.potassium_mg,
        vitaminAMcg: resolved.nutrition.vitamin_a_mcg,
        vitaminCMg: resolved.nutrition.vitamin_c_mg,
        vitaminDMcg: resolved.nutrition.vitamin_d_mcg,
        vitaminB12Mcg: resolved.nutrition.vitamin_b12_mcg,
        calciumMg: resolved.nutrition.calcium_mg,
        ironMg: resolved.nutrition.iron_mg,
      },
      db,
    );
    return row?.id ?? null;
  }

  private static async checkDb(
    itemName: string,
    db: DrizzleDb,
  ): Promise<ResolvedFoodItem | null> {
    const rows = await FoodItemsDAL.findByKeyword(itemName, db);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      canonicalName: row.name,
      keywords: JSON.parse(row.keywords ?? "[]"),
      isBranded: row.is_branded === 1,
      brand: row.brand,
      isPackaged: row.is_packaged === 1,
      ingredients: row.ingredients ? JSON.parse(row.ingredients) : null,
      source: row.source,
      nutrition: {
        calories_per_100g: row.calories_per_100g,
        protein_g: row.protein_g,
        carb_g: row.carb_g,
        fat_g: row.fat_g,
        fiber_g: row.fiber_g,
        sugar_g: row.sugar_g,
        sodium_mg: row.sodium_mg,
        saturated_fat_g: row.saturated_fat_g,
        cholesterol_mg: row.cholesterol_mg,
        trans_fat_g: row.trans_fat_g,
        potassium_mg: row.potassium_mg,
        vitamin_a_mcg: row.vitamin_a_mcg,
        vitamin_c_mg: row.vitamin_c_mg,
        vitamin_d_mcg: row.vitamin_d_mcg,
        vitamin_b12_mcg: row.vitamin_b12_mcg,
        calcium_mg: row.calcium_mg,
        iron_mg: row.iron_mg,
      },
      foundInDb: true,
      dbId: row.id,
    };
  }

  private static async fetchUsda(
    itemName: string,
    apiKey: string,
  ): Promise<NutritionData | null> {
    try {
      const url = `${AppConstants.NUTRITION_APIS.USDA_BASE}/foods/search?query=${encodeURIComponent(itemName)}&api_key=${apiKey}&dataType=Foundation,SR%20Legacy&pageSize=1`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        foods?: { foodNutrients?: { nutrientId: number; value: number }[] }[];
      };
      const food = data.foods?.[0];
      if (!food?.foodNutrients) return null;

      const nMap = new Map<number, number>();
      for (const n of food.foodNutrients) {
        nMap.set(n.nutrientId, n.value);
      }

      const ids = AppConstants.USDA_NUTRIENT_IDS;
      const energy = nMap.get(ids.ENERGY);
      if (energy == null) return null;

      return {
        calories_per_100g: energy,
        protein_g: nMap.get(ids.PROTEIN) ?? 0,
        carb_g: nMap.get(ids.CARBS) ?? 0,
        fat_g: nMap.get(ids.FAT) ?? 0,
        fiber_g: nMap.get(ids.FIBER) ?? null,
        sugar_g: nMap.get(ids.SUGAR) ?? null,
        sodium_mg: nMap.get(ids.SODIUM) ?? null,
        saturated_fat_g: nMap.get(ids.SATURATED_FAT) ?? null,
        cholesterol_mg: nMap.get(ids.CHOLESTEROL) ?? null,
        trans_fat_g: nMap.get(ids.TRANS_FAT) ?? null,
        potassium_mg: nMap.get(ids.POTASSIUM) ?? null,
        vitamin_a_mcg: nMap.get(ids.VITAMIN_A) ?? null,
        vitamin_c_mg: nMap.get(ids.VITAMIN_C) ?? null,
        vitamin_d_mcg: nMap.get(ids.VITAMIN_D) ?? null,
        vitamin_b12_mcg: nMap.get(ids.VITAMIN_B12) ?? null,
        calcium_mg: nMap.get(ids.CALCIUM) ?? null,
        iron_mg: nMap.get(ids.IRON) ?? null,
      };
    } catch {
      return null;
    }
  }

  private static async fetchOpenFoodFacts(
    itemName: string,
  ): Promise<NutritionData | null> {
    try {
      const url = `${AppConstants.NUTRITION_APIS.OFF_BASE}?search_terms=${encodeURIComponent(itemName)}&json=1&page_size=1`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        products?: { nutriments?: Record<string, number> }[];
      };
      const product = data.products?.[0];
      if (!product?.nutriments) return null;
      const n = product.nutriments;

      const energy = n["energy-kcal_100g"];
      if (energy == null) return null;

      return {
        calories_per_100g: energy,
        protein_g: n["proteins_100g"] ?? 0,
        carb_g: n["carbohydrates_100g"] ?? 0,
        fat_g: n["fat_100g"] ?? 0,
        fiber_g: n["fiber_100g"] ?? null,
        sugar_g: n["sugars_100g"] ?? null,
        sodium_mg: n["sodium_100g"] != null ? n["sodium_100g"] * 1000 : null,
        saturated_fat_g: n["saturated-fat_100g"] ?? null,
        cholesterol_mg: n["cholesterol_100g"] != null ? n["cholesterol_100g"] * 1000 : null,
        trans_fat_g: n["trans-fat_100g"] ?? null,
        potassium_mg: n["potassium_100g"] != null ? n["potassium_100g"] * 1000 : null,
        vitamin_a_mcg: null,
        vitamin_c_mg: n["vitamin-c_100g"] != null ? n["vitamin-c_100g"] * 1000 : null,
        vitamin_d_mcg: null,
        vitamin_b12_mcg: null,
        calcium_mg: n["calcium_100g"] != null ? n["calcium_100g"] * 1000 : null,
        iron_mg: n["iron_100g"] != null ? n["iron_100g"] * 1000 : null,
      };
    } catch {
      return null;
    }
  }

  private static async scrapeWithBrowser(
    itemName: string,
    browser: Fetcher,
    ai: Ai,
  ): Promise<NutritionData | null> {
    try {
      // Dynamic import — only available in Cloudflare Workers runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const puppeteer = await import("@cloudflare/puppeteer") as any;
      const b = await puppeteer.default.launch(browser);
      const page = await b.newPage();
      await page.goto(
        `https://www.google.com/search?q=${encodeURIComponent(itemName + " nutritional information per 100g")}`,
        { waitUntil: "domcontentloaded", timeout: 15000 },
      );
      const content: string = await page.content();
      await b.close();

      const prompt = `You are a nutrition data extractor. Given the HTML below, find and extract the nutritional information per 100g for "${itemName}". Return ONLY valid JSON with these exact keys (numbers, null if not found): calories_per_100g, protein_g, carb_g, fat_g, fiber_g, sugar_g, sodium_mg, saturated_fat_g, cholesterol_mg, trans_fat_g, potassium_mg, vitamin_a_mcg, vitamin_c_mg, vitamin_d_mcg, vitamin_b12_mcg, calcium_mg, iron_mg. If no nutrition panel is found, return null.\n\nHTML (truncated):\n${content.slice(0, 8000)}`;

      const aiResult = (await (ai as any).run("@cf/google/gemma-3-12b-it", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
      })) as { response?: string };

      const raw = aiResult?.response?.trim() ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]) as NutritionData | null;
      if (!parsed || parsed.calories_per_100g == null) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private static async estimateWithAi(
    itemName: string,
    ai: Ai,
  ): Promise<ResolvedFoodItem> {
    const prompt = `You are a nutritionist database. For the food item "${itemName}", return ONLY valid JSON (no markdown, no explanation) with these exact keys:
{
  "canonical_name": string,
  "keywords": string[],
  "is_branded": boolean,
  "brand": string | null,
  "is_packaged": boolean,
  "ingredients": string[] | null,
  "calories_per_100g": number,
  "protein_g": number,
  "carb_g": number,
  "fat_g": number,
  "fiber_g": number | null,
  "sugar_g": number | null,
  "sodium_mg": number | null,
  "saturated_fat_g": number | null,
  "cholesterol_mg": number | null,
  "trans_fat_g": number | null,
  "potassium_mg": number | null,
  "vitamin_a_mcg": number | null,
  "vitamin_c_mg": number | null,
  "vitamin_d_mcg": number | null,
  "vitamin_b12_mcg": number | null,
  "calcium_mg": number | null,
  "iron_mg": number | null
}
All numeric values are per 100g. calories_per_100g MUST be a positive number — never null or 0 unless the food has genuinely zero calories. Estimate from your nutritional knowledge. ingredients should be null for homemade/generic foods, an array for known packaged foods.`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (ai as any).run("@cf/google/gemma-3-12b-it", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      })) as { response?: string };

      const raw = result?.response?.trim() ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in AI response");
      const p = JSON.parse(match[0]);

      return {
        canonicalName: p.canonical_name ?? itemName,
        keywords: Array.isArray(p.keywords) ? p.keywords : [itemName.toLowerCase()],
        isBranded: Boolean(p.is_branded),
        brand: p.brand ?? null,
        isPackaged: Boolean(p.is_packaged),
        ingredients: Array.isArray(p.ingredients) ? p.ingredients : null,
        source: FoodItemSourceEnum.AiEstimated,
        nutrition: {
          calories_per_100g: Number(p.calories_per_100g) || 100,
          protein_g: Number(p.protein_g) || 0,
          carb_g: Number(p.carb_g) || 0,
          fat_g: Number(p.fat_g) || 0,
          fiber_g: p.fiber_g != null ? Number(p.fiber_g) : null,
          sugar_g: p.sugar_g != null ? Number(p.sugar_g) : null,
          sodium_mg: p.sodium_mg != null ? Number(p.sodium_mg) : null,
          saturated_fat_g: p.saturated_fat_g != null ? Number(p.saturated_fat_g) : null,
          cholesterol_mg: p.cholesterol_mg != null ? Number(p.cholesterol_mg) : null,
          trans_fat_g: p.trans_fat_g != null ? Number(p.trans_fat_g) : null,
          potassium_mg: p.potassium_mg != null ? Number(p.potassium_mg) : null,
          vitamin_a_mcg: p.vitamin_a_mcg != null ? Number(p.vitamin_a_mcg) : null,
          vitamin_c_mg: p.vitamin_c_mg != null ? Number(p.vitamin_c_mg) : null,
          vitamin_d_mcg: p.vitamin_d_mcg != null ? Number(p.vitamin_d_mcg) : null,
          vitamin_b12_mcg: p.vitamin_b12_mcg != null ? Number(p.vitamin_b12_mcg) : null,
          calcium_mg: p.calcium_mg != null ? Number(p.calcium_mg) : null,
          iron_mg: p.iron_mg != null ? Number(p.iron_mg) : null,
        },
        foundInDb: false,
        dbId: null,
      };
    } catch (err) {
      Logger.warn({
        correlationId: "nutrition-lookup",
        logCategory: "DATABASE",
        logAction: "NutritionAiEstimateFallback",
        message: `AI estimation failed for "${itemName}", using zeroed defaults`,
        error: err,
      });
      return {
        canonicalName: itemName,
        keywords: [itemName.toLowerCase()],
        isBranded: false,
        brand: null,
        isPackaged: false,
        ingredients: null,
        source: FoodItemSourceEnum.AiEstimated,
        nutrition: {
          calories_per_100g: 100,
          protein_g: 0,
          carb_g: 0,
          fat_g: 0,
          fiber_g: null,
          sugar_g: null,
          sodium_mg: null,
          saturated_fat_g: null,
          cholesterol_mg: null,
          trans_fat_g: null,
          potassium_mg: null,
          vitamin_a_mcg: null,
          vitamin_c_mg: null,
          vitamin_d_mcg: null,
          vitamin_b12_mcg: null,
          calcium_mg: null,
          iron_mg: null,
        },
        foundInDb: false,
        dbId: null,
      };
    }
  }
}
