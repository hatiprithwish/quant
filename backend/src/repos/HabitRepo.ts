import { DrizzleDb } from "../db";
import { HabitDAL } from "../data-access-layer/HabitDAL";

export interface HabitData {
  key: string;
  label: string;
  category: "time" | "food" | "money" | "investment" | "manual";
  is_distraction: boolean;
  occurred_days: number;
  total_days: number;
  hours?: number;
  amount?: number;
  count?: number;
  source: "auto" | "ai" | "manual";
  badge: "AUTO" | "AI" | "MANUAL";
  details: string;
  trend: "good" | "bad" | "neutral";
}

export interface GetHabitsResponse {
  isSuccess: boolean;
  message: string;
  week_from: string;
  week_to: string;
  habits: HabitData[];
  daysWithDailyLog: number;
  totalDays: number;
}

function durationHours(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.max(0, (end - start) / 3_600_000);
}

function nameMatchesDistraction(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("social") ||
    n.includes("scroll") ||
    n.includes("doom") ||
    n.includes("twitter") ||
    n.includes("instagram") ||
    n.includes("reddit") ||
    n.includes("facebook") ||
    n.includes("tiktok")
  );
}

function nameMatchesEntertainment(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("netflix") ||
    n.includes("streaming") ||
    n.includes("entertainment") ||
    n.includes("youtube") ||
    n.includes("prime")
  );
}

function nameMatchesFitness(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("fitness") ||
    n.includes("gym") ||
    n.includes("exercise") ||
    n.includes("workout") ||
    n.includes("sport") ||
    n.includes("running")
  );
}

function nameMatchesDeepWork(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("career") ||
    n.includes("work") ||
    n.includes("learning") ||
    n.includes("study") ||
    n.includes("focus") ||
    n.includes("coding") ||
    n.includes("dev") ||
    n.includes("personal-dev")
  );
}

const JUNK_FOOD_CALORIE_THRESHOLD = 600;
const JUNK_FOOD_FAT_THRESHOLD = 25;

function isJunkFood(entry: { calories: number; fat_g: number; item_name: string }): boolean {
  const name = entry.item_name.toLowerCase();
  const hasJunkKeyword =
    name.includes("burger") ||
    name.includes("pizza") ||
    name.includes("chips") ||
    name.includes("fried") ||
    name.includes("fries") ||
    name.includes("nugget") ||
    name.includes("soda") ||
    name.includes("cola") ||
    name.includes("zomato") ||
    name.includes("swiggy") ||
    name.includes("mcdonalds") ||
    name.includes("kfc") ||
    name.includes("dominos") ||
    name.includes("maggi");
  return (
    hasJunkKeyword ||
    (entry.calories >= JUNK_FOOD_CALORIE_THRESHOLD && entry.fat_g >= JUNK_FOOD_FAT_THRESHOLD)
  );
}

function weekDays(from: string, to: string): string[] {
  const days: string[] = [];
  const cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export class HabitRepo {
  static async getHabits(
    userId: string,
    from: string,
    to: string,
    db: DrizzleDb,
  ): Promise<GetHabitsResponse> {
    const params = { userId, from, to };
    const days = weekDays(from, to);
    const totalDays = days.length;

    const [timeLogs, foodEntries, expenseLogs, investmentDeposits, aiExtractions, dailyLogs, budgetCategoryIds] =
      await Promise.all([
        HabitDAL.findDistinctionHours(params, db),
        HabitDAL.findFoodLogs(params, db),
        HabitDAL.findExpenseLogs(params, db),
        HabitDAL.findInvestmentDeposits(params, db),
        HabitDAL.findHabitExtractions(params, db),
        HabitDAL.findDailyLogsForWeek(params, db),
        HabitDAL.findBudgetCategoryIds(userId, db),
      ]);

    const habits: HabitData[] = [];

    // ── Time: Doom scrolling ─────────────────────────────────────────────────
    const scrollLogs = timeLogs.filter(
      (l) => l.is_distraction === 1 && nameMatchesDistraction(l.bucket_name),
    );
    const scrollHours = scrollLogs.reduce(
      (sum, l) => sum + durationHours(l.started_at, l.ended_at),
      0,
    );
    const scrollDays = new Set(scrollLogs.map((l) => l.started_at.slice(0, 10))).size;
    habits.push({
      key: "doom_scrolling",
      label: "Doom Scrolling",
      category: "time",
      is_distraction: true,
      occurred_days: scrollDays,
      total_days: totalDays,
      hours: Math.round(scrollHours * 10) / 10,
      source: "auto",
      badge: "AUTO",
      details: scrollDays === 0
        ? "No doom scrolling detected this week"
        : `${Math.round(scrollHours * 10) / 10}h across ${scrollDays} day(s)`,
      trend: scrollHours === 0 ? "good" : scrollHours < 2 ? "neutral" : "bad",
    });

    // ── Time: Netflix / Streaming ────────────────────────────────────────────
    const netflixLogs = timeLogs.filter(
      (l) => l.is_distraction === 1 && nameMatchesEntertainment(l.bucket_name),
    );
    const netflixHours = netflixLogs.reduce(
      (sum, l) => sum + durationHours(l.started_at, l.ended_at),
      0,
    );
    const netflixDays = new Set(netflixLogs.map((l) => l.started_at.slice(0, 10))).size;
    habits.push({
      key: "streaming",
      label: "Netflix / Streaming",
      category: "time",
      is_distraction: true,
      occurred_days: netflixDays,
      total_days: totalDays,
      hours: Math.round(netflixHours * 10) / 10,
      source: "auto",
      badge: "AUTO",
      details: netflixDays === 0
        ? "No streaming detected this week"
        : `${Math.round(netflixHours * 10) / 10}h across ${netflixDays} day(s)`,
      trend: netflixHours === 0 ? "good" : netflixHours < 3 ? "neutral" : "bad",
    });

    // ── Time: Deep Work ──────────────────────────────────────────────────────
    const deepWorkLogs = timeLogs.filter(
      (l) => l.is_distraction === 0 && nameMatchesDeepWork(l.bucket_name),
    );
    const deepWorkHours = deepWorkLogs.reduce(
      (sum, l) => sum + durationHours(l.started_at, l.ended_at),
      0,
    );
    const deepWorkDays = new Set(deepWorkLogs.map((l) => l.started_at.slice(0, 10))).size;
    habits.push({
      key: "deep_work",
      label: "Deep Work",
      category: "time",
      is_distraction: false,
      occurred_days: deepWorkDays,
      total_days: totalDays,
      hours: Math.round(deepWorkHours * 10) / 10,
      source: "auto",
      badge: "AUTO",
      details: deepWorkDays === 0
        ? "No deep work logged this week"
        : `${Math.round(deepWorkHours * 10) / 10}h across ${deepWorkDays} day(s)`,
      trend: deepWorkHours >= 20 ? "good" : deepWorkHours >= 10 ? "neutral" : "bad",
    });

    // ── Time: Exercise ───────────────────────────────────────────────────────
    const exerciseLogs = timeLogs.filter(
      (l) => l.is_distraction === 0 && nameMatchesFitness(l.bucket_name),
    );
    const exerciseHours = exerciseLogs.reduce(
      (sum, l) => sum + durationHours(l.started_at, l.ended_at),
      0,
    );
    const exerciseDays = new Set(exerciseLogs.map((l) => l.started_at.slice(0, 10))).size;
    habits.push({
      key: "exercise",
      label: "Exercise",
      category: "time",
      is_distraction: false,
      occurred_days: exerciseDays,
      total_days: totalDays,
      hours: Math.round(exerciseHours * 10) / 10,
      source: "auto",
      badge: "AUTO",
      details: exerciseDays === 0
        ? "No exercise logged this week"
        : `${exerciseDays} session(s) · ${Math.round(exerciseHours * 10) / 10}h`,
      trend: exerciseDays >= 4 ? "good" : exerciseDays >= 2 ? "neutral" : "bad",
    });

    // ── Food: Junk Food ──────────────────────────────────────────────────────
    const junkEntries = foodEntries.filter(isJunkFood);
    const junkDays = new Set(junkEntries.map((e) => e.date)).size;
    habits.push({
      key: "junk_food",
      label: "Junk Food",
      category: "food",
      is_distraction: true,
      occurred_days: junkDays,
      total_days: totalDays,
      count: junkEntries.length,
      source: "auto",
      badge: "AUTO",
      details: junkDays === 0
        ? "No junk food detected this week"
        : `${junkEntries.length} item(s) across ${junkDays} day(s)`,
      trend: junkDays === 0 ? "good" : junkDays <= 2 ? "neutral" : "bad",
    });

    // ── Money: Impulse Spending ──────────────────────────────────────────────
    const budgetedIds = new Set(budgetCategoryIds);
    const impulseExpenses = expenseLogs.filter(
      (e) => !budgetedIds.has(e.category_id),
    );
    const impulseAmount = impulseExpenses.reduce((sum, e) => sum + e.amount, 0);
    const impulseDays = new Set(impulseExpenses.map((e) => e.date)).size;
    habits.push({
      key: "impulse_spending",
      label: "Impulse Spending",
      category: "money",
      is_distraction: true,
      occurred_days: impulseDays,
      total_days: totalDays,
      amount: Math.round(impulseAmount),
      count: impulseExpenses.length,
      source: "auto",
      badge: "AUTO",
      details: impulseExpenses.length === 0
        ? "No unbudgeted spending this week"
        : `₹${Math.round(impulseAmount).toLocaleString("en-IN")} across ${impulseExpenses.length} transaction(s)`,
      trend: impulseExpenses.length === 0 ? "good" : impulseAmount < 500 ? "neutral" : "bad",
    });

    // ── Investment: Deposits ─────────────────────────────────────────────────
    const investedAmount = investmentDeposits.reduce((sum, d) => sum + d.amount, 0);
    habits.push({
      key: "investment_deposit",
      label: "Investment Deposit",
      category: "investment",
      is_distraction: false,
      occurred_days: investmentDeposits.length > 0 ? 1 : 0,
      total_days: totalDays,
      amount: Math.round(investedAmount),
      count: investmentDeposits.length,
      source: "auto",
      badge: "AUTO",
      details: investmentDeposits.length === 0
        ? "No investments deposited this week"
        : `₹${Math.round(investedAmount).toLocaleString("en-IN")} invested (${investmentDeposits.length} deposit(s))`,
      trend: investedAmount > 0 ? "good" : "bad",
    });

    // ── AI Extractions: Meditation ───────────────────────────────────────────
    const meditationExtractions = aiExtractions.filter((e) => e.habit_key === "meditation");
    const meditationDays = meditationExtractions.filter((e) => e.occurred === 1).length;
    habits.push({
      key: "meditation",
      label: "Meditation",
      category: "manual",
      is_distraction: false,
      occurred_days: meditationDays,
      total_days: totalDays,
      source: meditationExtractions.length > 0 ? "ai" : "manual",
      badge: meditationExtractions.length > 0 ? "AI" : "MANUAL",
      details: meditationDays === 0
        ? "Meditation not detected in daily logs this week"
        : `Meditated ${meditationDays} day(s) — detected from daily log`,
      trend: meditationDays >= 5 ? "good" : meditationDays >= 3 ? "neutral" : "bad",
    });

    const daysWithDailyLog = dailyLogs.filter((l) => l.content && l.content.trim().length > 10).length;

    return {
      isSuccess: true,
      message: "OK",
      week_from: from,
      week_to: to,
      habits,
      daysWithDailyLog,
      totalDays,
    };
  }
}
