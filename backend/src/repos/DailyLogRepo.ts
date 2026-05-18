// @service: daily-log
import { DrizzleDb } from "../db";
import { DailyLogDAL } from "../data-access-layer/DailyLogDAL";
import { FoodDAL } from "../data-access-layer/FoodDAL";
import { ExpenseDAL } from "../data-access-layer/ExpenseDAL";
import { TimeDAL } from "../data-access-layer/TimeDAL";
import { TimeBucketsDAL } from "../data-access-layer/TimeBucketsDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import { WalletDAL } from "../data-access-layer/WalletDAL";
import {
  SaveDailyLogRepoRequest,
  WeeklyReviewRepoRequest,
  CompareDaysRepoRequest,
  GetDailyLogResponse,
  SaveDailyLogResponse,
  ListDailyLogsResponse,
  AnalyzeDailyLogResponse,
  SkippedEntry,
  WeeklyReviewResponse,
  CompareDaysResponse,
  MealTypeLabelEnum,
  mealTypeLabelToInt,
} from "../schemas";
import { DailyLog } from "../db/tables";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

function toEntry(log: DailyLog) {
  return {
    id: log.id,
    date: log.date,
    content: log.content,
    ai_processed: log.ai_processed === 1,
    ai_processed_at: log.ai_processed_at,
    created_at: log.created_at,
    updated_at: log.updated_at,
  };
}

export class DailyLogRepo {
  static async getByDate(
    userId: string,
    date: string,
    db: DrizzleDb,
  ): Promise<GetDailyLogResponse> {
    const log = await DailyLogDAL.getByDate({ userId, date }, db);
    return {
      isSuccess: true,
      message: "Daily log retrieved",
      log: log ? toEntry(log) : null,
    };
  }

  static async save(
    req: SaveDailyLogRepoRequest,
    db: DrizzleDb,
  ): Promise<SaveDailyLogResponse> {
    const log = await DailyLogDAL.upsert(
      { userId: req.userId, date: req.date, content: req.content },
      db,
    );
    return { isSuccess: true, message: "Daily log saved", log: toEntry(log) };
  }

  static async list(
    userId: string,
    db: DrizzleDb,
  ): Promise<ListDailyLogsResponse> {
    const rows = await DailyLogDAL.listByUser(userId, db);
    return {
      isSuccess: true,
      message: "Daily logs retrieved",
      logs: rows.map((r) => ({
        id: r.id,
        date: r.date,
        ai_processed: r.ai_processed === 1,
      })),
    };
  }

  static async analyzeDailyLog(
    userId: string,
    date: string,
    ai: Ai,
    db: DrizzleDb,
  ): Promise<AnalyzeDailyLogResponse> {
    const log = await DailyLogDAL.getByDate({ userId, date }, db);
    if (!log || !log.content.trim()) {
      return {
        isSuccess: false,
        message: "No content to analyze for this date",
        summary: {
          meals_logged: 0,
          expenses_logged: 0,
          time_entries_logged: 0,
          details: "",
        },
        skipped_entries: [],
      };
    }

    const [buckets, categories, wallets] = await Promise.all([
      TimeBucketsDAL.findByUserId(userId, db),
      MoneyCategoryDAL.findAll(userId, db),
      WalletDAL.findAllWithBalance({ userId }, db),
    ]);

    const prompt = buildAnalyzePrompt(log.content, date, buckets, categories, wallets);
    const aiRes = (await ai.run(
      "@cf/google/gemma-3-12b-it" as string & {},
      { prompt, max_tokens: 2048 } as Record<string, unknown>,
    )) as { response?: string };

    Logger.info({
      correlationId: "analyze",
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "AnalyzeDailyLogAiRaw",
      message: "AI raw response",
      metadata: { rawResponse: aiRes.response?.slice(0, 2000) },
    });

    const parsed = parseAnalyzeResponse(aiRes.response);

    Logger.info({
      correlationId: "analyze",
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "AnalyzeDailyLogParsed",
      message: "Parsed AI response",
      metadata: {
        meals: parsed.meals.length,
        expenses: parsed.expenses.length,
        timeEntries: parsed.timeEntries.length,
      },
    });

    const defaultWalletId = wallets[0]?.id ?? null;
    const skipped: SkippedEntry[] = [];

    // Insert meals
    const mealRows = (parsed.meals as Array<Record<string, unknown>>).map(
      (m) => {
        const labelRaw = String(m.meal_type ?? "snack").toLowerCase();
        const label = (
          Object.values(MealTypeLabelEnum).includes(
            labelRaw as MealTypeLabelEnum,
          )
            ? labelRaw
            : MealTypeLabelEnum.Snack
        ) as MealTypeLabelEnum;
        return {
          userId,
          date,
          mealType: mealTypeLabelToInt[label],
          itemName: String(m.item_name ?? "Unknown"),
          amount: null,
          unit: null,
          calories: Number(m.calories ?? 0),
          proteinG: Number(m.protein_g ?? 0),
          carbG: Number(m.carb_g ?? 0),
          fatG: Number(m.fat_g ?? 0),
        };
      },
    );
    if (mealRows.length > 0) {
      await FoodDAL.deleteByDate(userId, date, db);
      await FoodDAL.insertMany(mealRows, db);
      Logger.info({ correlationId: "analyze", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "AnalyzeMealsInserted", message: `Inserted ${mealRows.length} meals`, metadata: {} });
    }

    // Insert expenses — exact match on category_name and wallet_name provided by AI
    const expenseRows: Parameters<typeof ExpenseDAL.insertMany>[0] = [];
    for (const e of parsed.expenses as Array<Record<string, unknown>>) {
      const categoryName = String(e.category_name ?? "").toLowerCase();
      const walletName = e.wallet_name ? String(e.wallet_name).toLowerCase() : null;
      const matchedCategory = categories.find((c) => c.name.toLowerCase() === categoryName);
      if (!matchedCategory) {
        skipped.push({
          type: "expense",
          raw: `${e.description ?? e.category_name} (₹${e.amount})`,
          reason: `No matching category found for "${e.category_name}"`,
        });
        continue;
      }
      const matchedWallet = walletName
        ? wallets.find((w) => w.name.toLowerCase() === walletName)
        : null;
      expenseRows.push({
        userId,
        date,
        amount: Number(e.amount ?? 0),
        currency: "INR",
        categoryId: matchedCategory.id,
        description: String(e.description ?? ""),
        walletId: matchedWallet?.id ?? defaultWalletId,
      });
    }
    if (expenseRows.length > 0) {
      await ExpenseDAL.insertMany(expenseRows, db);
      Logger.info({ correlationId: "analyze", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "AnalyzeExpensesInserted", message: `Inserted ${expenseRows.length} expenses`, metadata: {} });
    }

    // Insert time entries — exact match on bucket_name provided by AI
    const timeRows: Parameters<typeof TimeDAL.insertMany>[0] = [];
    for (const t of parsed.timeEntries as Array<Record<string, unknown>>) {
      const bucketName = String(t.bucket_name ?? "").toLowerCase();
      const matched = buckets.find((b) => b.name.toLowerCase() === bucketName);
      if (!matched) {
        skipped.push({
          type: "time_entry",
          raw: `${t.activity} (${t.duration_minutes} min)`,
          reason: `No matching time bucket found for "${t.bucket_name}"`,
        });
        continue;
      }
      const durationMins = Number(t.duration_minutes ?? 30);
      const started_at = `${date}T09:00:00`;
      const ended_at = new Date(
        new Date(started_at).getTime() + durationMins * 60000,
      )
        .toISOString()
        .replace("Z", "");
      timeRows.push({
        userId,
        bucket_id: matched.id,
        activity: String(t.activity ?? ""),
        started_at,
        ended_at,
      });
    }
    if (timeRows.length > 0) {
      await TimeDAL.insertMany(timeRows, db);
      Logger.info({ correlationId: "analyze", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "AnalyzeTimeInserted", message: `Inserted ${timeRows.length} time entries`, metadata: {} });
    }

    if (mealRows.length > 0 || expenseRows.length > 0 || timeRows.length > 0) {
      await DailyLogDAL.markAiProcessed(
        { userId, date, ai_processed_at: new Date().toISOString() },
        db,
      );
    }

    return {
      isSuccess: true,
      message: "Daily log analyzed",
      summary: {
        meals_logged: mealRows.length,
        expenses_logged: expenseRows.length,
        time_entries_logged: timeRows.length,
        details: parsed.details,
      },
      skipped_entries: skipped,
    };
  }

  static async weeklyReview(
    req: WeeklyReviewRepoRequest,
    ai: Ai,
    db: DrizzleDb,
  ): Promise<WeeklyReviewResponse> {
    const logs = await DailyLogDAL.getByDateRange(
      { userId: req.userId, from: req.from, to: req.to },
      db,
    );

    if (logs.length === 0) {
      return {
        isSuccess: false,
        message: "No daily logs found for the given date range",
        review: {
          wins: [],
          misses: [],
          recommendations: [],
          metrics_summary: "",
        },
      };
    }

    const prompt = buildWeeklyReviewPrompt(logs);
    const aiRes = (await ai.run(
      "@cf/google/gemma-3-12b-it" as string & {},
      { prompt } as Record<string, unknown>,
    )) as { response?: string };

    const review = parseWeeklyReviewResponse(aiRes.response);
    return { isSuccess: true, message: "Weekly review generated", review };
  }

  static async compareDays(
    req: CompareDaysRepoRequest,
    ai: Ai,
    db: DrizzleDb,
  ): Promise<CompareDaysResponse> {
    const [log1, log2] = await Promise.all([
      DailyLogDAL.getByDate({ userId: req.userId, date: req.date1 }, db),
      DailyLogDAL.getByDate({ userId: req.userId, date: req.date2 }, db),
    ]);

    if (!log1 || !log2) {
      return {
        isSuccess: false,
        message: "One or both daily logs not found",
        comparison: {
          better_areas: [],
          worse_areas: [],
          one_percent_suggestions: [],
          verdict: "",
        },
      };
    }

    const prompt = buildCompareDaysPrompt(log1, log2);
    const aiRes = (await ai.run(
      "@cf/google/gemma-3-12b-it" as string & {},
      { prompt } as Record<string, unknown>,
    )) as { response?: string };

    const comparison = parseCompareDaysResponse(aiRes.response);
    return { isSuccess: true, message: "Day comparison generated", comparison };
  }
}

function buildAnalyzePrompt(
  content: string,
  date: string,
  buckets: { id: number; name: string }[],
  categories: { id: number; name: string }[],
  wallets: { id: number; name: string }[],
): string {
  const bucketList = buckets.map((b) => b.name).join(", ");
  const categoryList = categories.map((c) => c.name).join(", ");
  const walletList = wallets.map((w) => w.name).join(", ");

  return `You are a personal life tracker AI. Analyze the following daily log entry for ${date} and extract structured data.

DAILY LOG:
${content}

AVAILABLE TIME BUCKETS (use EXACTLY one of these names for bucket_name):
${bucketList}

AVAILABLE EXPENSE CATEGORIES (use EXACTLY one of these names for category_name):
${categoryList}

AVAILABLE WALLETS (use EXACTLY one of these names for wallet_name, or null if not mentioned):
${walletList}

Extract and return a JSON object with this exact structure:
{
  "meals": [
    { "item_name": "string", "meal_type": "breakfast|lunch|dinner|snack", "calories": number_or_null, "protein_g": number_or_null, "carb_g": number_or_null, "fat_g": number_or_null }
  ],
  "expenses": [
    { "description": "string", "amount": number, "category_name": "exact name from AVAILABLE EXPENSE CATEGORIES", "wallet_name": "exact name from AVAILABLE WALLETS or null" }
  ],
  "time_entries": [
    { "activity": "string", "bucket_name": "exact name from AVAILABLE TIME BUCKETS", "duration_minutes": number }
  ],
  "details": "A 1-2 sentence plain English summary of what was logged."
}

Rules:
- Only extract things explicitly mentioned. Do not invent data.
- For meals: ALWAYS estimate calories and macros using standard nutrition databases. For example: oats 50g = 189 kcal, 6g protein, 32g carb, 3g fat; peanut butter 30g = 188 kcal, 8g protein, 6g carb, 16g fat; watermelon 100g = 30 kcal, 0.6g protein, 8g carb, 0.2g fat; whey/protein powder 30g = 120 kcal, 24g protein, 3g carb, 2g fat. Use your knowledge — never leave calories null for common foods.
- For expenses: you MUST pick category_name from the AVAILABLE EXPENSE CATEGORIES list exactly. Wallets are payment methods (bank accounts, cards) — pick from AVAILABLE WALLETS if mentioned, otherwise null.
- For time: you MUST pick bucket_name from the AVAILABLE TIME BUCKETS list exactly. Pick the closest match.
- Return ONLY the JSON object, no markdown, no explanation.`;
}

function buildWeeklyReviewPrompt(logs: DailyLog[]): string {
  const logText = logs
    .map((l) => `=== ${l.date} ===\n${l.content || "(no entry)"}`)
    .join("\n\n");

  return `You are a personal life coach AI. Analyze the following 7-day daily log and provide a weekly review.

DAILY LOGS:
${logText}

Return a JSON object with this exact structure:
{
  "wins": ["list of things done well this week, max 5 items"],
  "misses": ["list of areas that need improvement, max 5 items"],
  "recommendations": ["specific actionable steps for next week, max 5 items"],
  "metrics_summary": "A 2-3 sentence summary of patterns observed across nutrition, finances, time use, and general habits."
}

Rules:
- Be honest, specific, and constructive.
- Focus on patterns across the week, not individual days.
- Return ONLY the JSON object, no markdown, no explanation.`;
}

function buildCompareDaysPrompt(log1: DailyLog, log2: DailyLog): string {
  return `You are a personal improvement AI. Compare these two daily logs and determine if the person improved from ${log1.date} to ${log2.date}.

DAY 1 (${log1.date}):
${log1.content || "(no entry)"}

DAY 2 (${log2.date}):
${log2.content || "(no entry)"}

Return a JSON object with this exact structure:
{
  "better_areas": ["areas where day 2 was better than day 1"],
  "worse_areas": ["areas where day 2 was worse than day 1"],
  "one_percent_suggestions": ["specific micro-improvements for tomorrow, max 3 items"],
  "verdict": "One sentence: did they improve by at least 1% overall? Why or why not?"
}

Rules:
- Compare honestly. Empty or missing data counts as a miss.
- One percent better means any small measurable improvement.
- Return ONLY the JSON object, no markdown, no explanation.`;
}

function parseAnalyzeResponse(raw: string | undefined): {
  meals: unknown[];
  expenses: unknown[];
  timeEntries: unknown[];
  details: string;
} {
  if (!raw) return { meals: [], expenses: [], timeEntries: [], details: "" };
  try {
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      meals: parsed.meals ?? [],
      expenses: parsed.expenses ?? [],
      timeEntries: parsed.time_entries ?? [],
      details: parsed.details ?? "",
    };
  } catch (err) {
    Logger.error({ correlationId: "analyze", logCategory: "HTTP", logAction: "AnalyzeParseFailure", message: "Failed to parse AI response — likely truncated", error: err, metadata: { tail: raw.slice(-300) } });
    return {
      meals: [],
      expenses: [],
      timeEntries: [],
      details: raw.slice(0, 200),
    };
  }
}

function parseWeeklyReviewResponse(
  raw: string | undefined,
): WeeklyReviewResponse["review"] {
  if (!raw)
    return { wins: [], misses: [], recommendations: [], metrics_summary: "" };
  try {
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      wins: parsed.wins ?? [],
      misses: parsed.misses ?? [],
      recommendations: parsed.recommendations ?? [],
      metrics_summary: parsed.metrics_summary ?? "",
    };
  } catch {
    return {
      wins: [],
      misses: [],
      recommendations: [],
      metrics_summary: raw.slice(0, 500),
    };
  }
}

function parseCompareDaysResponse(
  raw: string | undefined,
): CompareDaysResponse["comparison"] {
  if (!raw)
    return {
      better_areas: [],
      worse_areas: [],
      one_percent_suggestions: [],
      verdict: "",
    };
  try {
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      better_areas: parsed.better_areas ?? [],
      worse_areas: parsed.worse_areas ?? [],
      one_percent_suggestions: parsed.one_percent_suggestions ?? [],
      verdict: parsed.verdict ?? "",
    };
  } catch {
    return {
      better_areas: [],
      worse_areas: [],
      one_percent_suggestions: [],
      verdict: raw.slice(0, 200),
    };
  }
}
