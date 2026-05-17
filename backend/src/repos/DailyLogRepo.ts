// @service: daily-log
import { DrizzleDb } from "../db";
import { DailyLogDAL } from "../data-access-layer/DailyLogDAL";
import {
  SaveDailyLogRepoRequest,
  WeeklyReviewRepoRequest,
  CompareDaysRepoRequest,
  GetDailyLogResponse,
  SaveDailyLogResponse,
  ListDailyLogsResponse,
  AnalyzeDailyLogResponse,
  WeeklyReviewResponse,
  CompareDaysResponse,
} from "../schemas";
import { DailyLog } from "../db/tables";

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

  static async analyze(
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
        summary: { meals_logged: 0, expenses_logged: 0, time_entries_logged: 0, details: "" },
      };
    }

    const prompt = buildAnalyzePrompt(log.content, date);
    const aiRes = await ai.run(
      "@cf/google/gemma-3-12b-it" as string & {},
      { prompt } as Record<string, unknown>,
    ) as { response?: string };

    const parsed = parseAnalyzeResponse(aiRes.response);

    if (parsed.meals.length > 0 || parsed.expenses.length > 0 || parsed.timeEntries.length > 0) {
      await DailyLogDAL.markAiProcessed(
        { userId, date, ai_processed_at: new Date().toISOString() },
        db,
      );
    }

    return {
      isSuccess: true,
      message: "Daily log analyzed",
      summary: {
        meals_logged: parsed.meals.length,
        expenses_logged: parsed.expenses.length,
        time_entries_logged: parsed.timeEntries.length,
        details: parsed.details,
      },
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
        review: { wins: [], misses: [], recommendations: [], metrics_summary: "" },
      };
    }

    const prompt = buildWeeklyReviewPrompt(logs);
    const aiRes = await ai.run(
      "@cf/google/gemma-3-12b-it" as string & {},
      { prompt } as Record<string, unknown>,
    ) as { response?: string };

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
        comparison: { better_areas: [], worse_areas: [], one_percent_suggestions: [], verdict: "" },
      };
    }

    const prompt = buildCompareDaysPrompt(log1, log2);
    const aiRes = await ai.run(
      "@cf/google/gemma-3-12b-it" as string & {},
      { prompt } as Record<string, unknown>,
    ) as { response?: string };

    const comparison = parseCompareDaysResponse(aiRes.response);
    return { isSuccess: true, message: "Day comparison generated", comparison };
  }
}

function buildAnalyzePrompt(content: string, date: string): string {
  return `You are a personal life tracker AI. Analyze the following daily log entry for ${date} and extract structured data.

DAILY LOG:
${content}

Extract and return a JSON object with this exact structure:
{
  "meals": [
    { "item_name": "string", "meal_type": "breakfast|lunch|dinner|snack", "calories": number_or_null, "protein_g": number_or_null, "carb_g": number_or_null, "fat_g": number_or_null }
  ],
  "expenses": [
    { "description": "string", "amount": number, "category_hint": "string" }
  ],
  "time_entries": [
    { "activity": "string", "bucket_hint": "string", "duration_minutes": number }
  ],
  "details": "A 1-2 sentence plain English summary of what was logged."
}

Rules:
- Only extract things explicitly mentioned. Do not invent data.
- For meals: estimate macros only if the food is common and estimable.
- For expenses: extract any money spent with amounts.
- For time: extract activities with approximate durations if mentioned.
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
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      meals: parsed.meals ?? [],
      expenses: parsed.expenses ?? [],
      timeEntries: parsed.time_entries ?? [],
      details: parsed.details ?? "",
    };
  } catch {
    return { meals: [], expenses: [], timeEntries: [], details: raw.slice(0, 200) };
  }
}

function parseWeeklyReviewResponse(raw: string | undefined): WeeklyReviewResponse["review"] {
  if (!raw) return { wins: [], misses: [], recommendations: [], metrics_summary: "" };
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      wins: parsed.wins ?? [],
      misses: parsed.misses ?? [],
      recommendations: parsed.recommendations ?? [],
      metrics_summary: parsed.metrics_summary ?? "",
    };
  } catch {
    return { wins: [], misses: [], recommendations: [], metrics_summary: raw.slice(0, 500) };
  }
}

function parseCompareDaysResponse(raw: string | undefined): CompareDaysResponse["comparison"] {
  if (!raw) return { better_areas: [], worse_areas: [], one_percent_suggestions: [], verdict: "" };
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      better_areas: parsed.better_areas ?? [],
      worse_areas: parsed.worse_areas ?? [],
      one_percent_suggestions: parsed.one_percent_suggestions ?? [],
      verdict: parsed.verdict ?? "",
    };
  } catch {
    return { better_areas: [], worse_areas: [], one_percent_suggestions: [], verdict: raw.slice(0, 200) };
  }
}
