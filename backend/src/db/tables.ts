import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import {
  MealTypeIntEnum,
  WalletTypeEnum,
  BudgetPeriodEnum,
  RecurringTransactionPeriodEnum,
  DebtTypeEnum,
  DebtStatusEnum,
  QuestStatusEnum,
  QuestCategoryEnum,
  MilestoneStatusEnum,
  TaskStatusEnum,
  XpSourceTypeEnum,
  MoneyCategoryTypeEnum,
  TrajectoryPhaseEnum,
  TaskPhaseTagEnum,
  GoalChangeTypeEnum,
  EliminationResultEnum,
  WeeklyCheckinStatusEnum,
} from "../schemas";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clerk_user_id: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text("deleted_at"),
});

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  key: text("key").notNull().unique(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  revoked_at: text("revoked_at"),
});

export const moneyCategories = sqliteTable("money_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  display_label: text("display_label").notNull(),
  color: text("color").notNull(),
  type: text("type").$type<MoneyCategoryTypeEnum>().notNull(),
  deleted_at: text("deleted_at"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  type: text("type").$type<WalletTypeEnum>().notNull(),
  credit_limit: real("credit_limit"),
  active: integer("active").notNull().default(1),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const depositLogs = sqliteTable("deposit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  wallet_id: integer("wallet_id")
    .notNull()
    .references(() => wallets.id),
  date: text("date").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  category_id: integer("category_id")
    .notNull()
    .references(() => moneyCategories.id),
  description: text("description"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const foodLogs = sqliteTable("food_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  meal_type: integer("meal_type").$type<MealTypeIntEnum>().notNull(),
  item_name: text("item_name").notNull(),
  amount: real("amount"),
  unit: text("unit"),
  calories: integer("calories").notNull(),
  protein_g: real("protein_g").notNull().default(0),
  carb_g: real("carb_g").notNull().default(0),
  fat_g: real("fat_g").notNull().default(0),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const expenseLogs = sqliteTable("expense_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  wallet_id: integer("wallet_id").references(() => wallets.id),
  date: text("date").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  category_id: integer("category_id")
    .notNull()
    .references(() => moneyCategories.id),
  description: text("description"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const timeBuckets = sqliteTable("time_buckets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
  is_distraction: integer("is_distraction").notNull().default(0),
  is_archived: integer("is_archived").notNull().default(0),
  quest_id: text("quest_id"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text("deleted_at"),
});

export const timeLogs = sqliteTable("time_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  bucket_id: integer("bucket_id")
    .notNull()
    .references(() => timeBuckets.id),
  activity: text("activity").notNull(),
  started_at: text("started_at").notNull(),
  ended_at: text("ended_at").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text("deleted_at"),
});

export const oauthAuthCodes = sqliteTable("oauth_auth_codes", {
  id: text("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  code: text("code").notNull().unique(),
  redirect_uri: text("redirect_uri").notNull(),
  code_challenge: text("code_challenge").notNull(),
  code_challenge_method: text("code_challenge_method")
    .notNull()
    .default("S256"),
  expires_at: text("expires_at").notNull(),
  used: integer("used").notNull().default(0),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// @service: daily-log
export const dailyLogs = sqliteTable(
  "daily_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    content: text("content").notNull().default(""),
    ai_processed: integer("ai_processed").notNull().default(0),
    ai_processed_at: text("ai_processed_at"),
    created_at: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("UK_daily_logs_user_id_date").on(t.user_id, t.date)],
);

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
  amount: real("amount").notNull(),
  period: text("period").$type<BudgetPeriodEnum>().notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const budgetCategories = sqliteTable(
  "budget_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    budget_id: integer("budget_id")
      .notNull()
      .references(() => budgets.id),
    category_id: integer("category_id")
      .notNull()
      .references(() => moneyCategories.id),
  },
  (t) => ({
    budgetCategoryUnique: uniqueIndex("budget_categories_budget_category_unique").on(
      t.budget_id,
      t.category_id,
    ),
  }),
);

export const recurringTransactionItems = sqliteTable("recurring_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  wallet_id: integer("wallet_id")
    .references(() => wallets.id),
  type: text("type").$type<"expense" | "income" | "transfer">().notNull().default("expense"),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  period: text("period").$type<RecurringTransactionPeriodEnum>().notNull(),
  interval: integer("interval").notNull().default(1),
  week_days: text("week_days"),
  month_end: integer("month_end").notNull().default(0),
  end_condition: text("end_condition").$type<"forever" | "until" | "for">().notNull().default("forever"),
  end_date: text("end_date"),
  occurrences: integer("occurrences"),
  category_id: integer("category_id")
    .references(() => moneyCategories.id),
  description: text("description"),
  next_date: text("next_date").notNull(),
  to_wallet_id: integer("to_wallet_id").references(() => wallets.id),
  asset_id: integer("asset_id").references(() => investmentAssets.id),
  from_asset_id: integer("from_asset_id").references(() => investmentAssets.id),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const debts = sqliteTable("debts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").$type<DebtTypeEnum>().notNull(),
  counterparty_name: text("counterparty_name").notNull(),
  amount: real("amount").notNull(),
  paid_amount: real("paid_amount").notNull().default(0),
  status: text("status")
    .$type<DebtStatusEnum>()
    .notNull()
    .default(DebtStatusEnum.Pending),
  date: text("date").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  description: text("description"),
  wallet_id: integer("wallet_id").references(() => wallets.id),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const transferLogs = sqliteTable("transfer_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  from_wallet_id: integer("from_wallet_id")
    .notNull()
    .references(() => wallets.id),
  to_wallet_id: integer("to_wallet_id")
    .notNull()
    .references(() => wallets.id),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  description: text("description"),
  date: text("date").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const debtRepayments = sqliteTable("debt_repayments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  debt_id: integer("debt_id")
    .notNull()
    .references(() => debts.id),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  note: text("note"),
  wallet_id: integer("wallet_id").references(() => wallets.id),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const bodyMetrics = sqliteTable("body_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  locked: integer("locked").notNull().default(0),
  deleted_at: text("deleted_at"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const bodyMeasurementLogs = sqliteTable("body_measurement_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  metric_id: integer("metric_id")
    .notNull()
    .references(() => bodyMetrics.id),
  value: real("value").notNull(),
  recorded_at: text("recorded_at").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const quests = sqliteTable("quests", {
  id: text("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").$type<QuestCategoryEnum>().notNull(),
  color: text("color").notNull(),
  status: text("status").$type<QuestStatusEnum>().notNull().default(QuestStatusEnum.Active),
  deadline: text("deadline"),
  // Trajectory phase — null means standalone (free-form quest)
  trajectory_phase: text("trajectory_phase").$type<TrajectoryPhaseEnum>(),
  // Links lower-phase quests to their parent five-year goal
  parent_quest_id: text("parent_quest_id").references((): any => quests.id),
  // Escape number target (only for five_year quests of financial type)
  escape_number: real("escape_number"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text("deleted_at"),
});

export const questMilestones = sqliteTable("quest_milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quest_id: text("quest_id")
    .notNull()
    .references(() => quests.id),
  name: text("name").notNull(),
  xp_reward: integer("xp_reward").notNull().default(100),
  order: integer("order").notNull().default(0),
  status: text("status").$type<MilestoneStatusEnum>().notNull().default(MilestoneStatusEnum.Pending),
  due_date: text("due_date"),
  // AI-projected completion date based on current pace
  projected_date: text("projected_date"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const questTasks = sqliteTable("quest_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quest_id: text("quest_id")
    .notNull()
    .references(() => quests.id),
  milestone_id: integer("milestone_id").references(() => questMilestones.id),
  name: text("name").notNull(),
  status: text("status").$type<TaskStatusEnum>().notNull().default(TaskStatusEnum.Todo),
  xp_reward: integer("xp_reward").notNull().default(20),
  due_date: text("due_date"),
  // Phase tag for trajectory scoring (null = regular task)
  phase_tag: text("phase_tag").$type<TaskPhaseTagEnum>(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const questXpEvents = sqliteTable("quest_xp_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  quest_id: text("quest_id").references(() => quests.id),
  source_type: text("source_type").$type<XpSourceTypeEnum>().notNull(),
  source_id: integer("source_id"),
  xp: integer("xp").notNull(),
  occurred_at: text("occurred_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const userAchievements = sqliteTable("user_achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  achievement_key: text("achievement_key").notNull(),
  unlocked_at: text("unlocked_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const userStreaks = sqliteTable("user_streaks", {
  user_id: text("user_id")
    .primaryKey()
    .references(() => users.id),
  current_streak: integer("current_streak").notNull().default(0),
  longest_streak: integer("longest_streak").notNull().default(0),
  last_active_date: text("last_active_date"),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const investmentAccounts = sqliteTable("investment_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text("deleted_at"),
});

export const investmentAssets = sqliteTable("investment_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  account_id: integer("account_id")
    .notNull()
    .references(() => investmentAccounts.id),
  name: text("name").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text("deleted_at"),
});

export const investmentCashFlows = sqliteTable("investment_cash_flows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  asset_id: integer("asset_id")
    .notNull()
    .references(() => investmentAssets.id),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  wallet_id: integer("wallet_id").references(() => wallets.id),
  description: text("description"),
  // "wallet_to_asset" | "asset_to_wallet" — set for recurring transfer flows so they
  // show as a single transfer entry instead of a separate expense/deposit
  transfer_type: text("transfer_type"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const assetValueSnapshots = sqliteTable("asset_value_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  asset_id: integer("asset_id")
    .notNull()
    .references(() => investmentAssets.id),
  value: real("value").notNull(),
  snapshot_date: text("snapshot_date").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── TRAJECTORY INTELLIGENCE TABLES ──────────────────────────────────────────

export const trajectoryConfig = sqliteTable("trajectory_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  escape_number: real("escape_number"),
  monthly_investment_target: real("monthly_investment_target"),
  assumed_annual_return_rate: real("assumed_annual_return_rate").default(0.12),
  current_monthly_income: real("current_monthly_income"),
  income_milestone_year1: real("income_milestone_year1"),
  income_milestone_year3: real("income_milestone_year3"),
  checkin_due: integer("checkin_due").notNull().default(0),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const weeklyCheckins = sqliteTable(
  "weekly_checkins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    // ISO date of Monday for this week (primary lookup key)
    week_start: text("week_start").notNull(),
    status: text("status")
      .$type<WeeklyCheckinStatusEnum>()
      .notNull()
      .default(WeeklyCheckinStatusEnum.Pending),
    // AI-computed component scores (0–100)
    task_completion_score: real("task_completion_score"),
    elimination_score: real("elimination_score"),
    decision_alignment_score: real("decision_alignment_score"),
    confidence_score: real("confidence_score"),
    // Weighted final score
    weekly_score: real("weekly_score"),
    // Full LLM-generated analysis (JSON)
    ai_analysis: text("ai_analysis"),
    // User correction notes keyed by section (JSON)
    user_corrections: text("user_corrections"),
    ai_model_version: text("ai_model_version"),
    reviewed_at: text("reviewed_at"),
    created_at: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("UK_weekly_checkins_user_week").on(t.user_id, t.week_start)],
);

export const goalChangeRequests = sqliteTable("goal_change_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  quest_id: text("quest_id")
    .notNull()
    .references(() => quests.id),
  change_type: text("change_type").$type<GoalChangeTypeEnum>().notNull(),
  reason: text("reason").notNull(),
  old_description: text("old_description"),
  new_description: text("new_description"),
  xp_penalty: integer("xp_penalty").notNull().default(0),
  // Cooling-off window: change locked until this timestamp
  cooling_off_until: text("cooling_off_until").notNull(),
  confirmed_at: text("confirmed_at"),
  cancelled_at: text("cancelled_at"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const eliminationItems = sqliteTable("elimination_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  // ISO date of Monday for the week this item belongs to
  week_start: text("week_start").notNull(),
  description: text("description").notNull(),
  linked_time_bucket_id: integer("linked_time_bucket_id").references(() => timeBuckets.id),
  linked_money_category_id: integer("linked_money_category_id").references(() => moneyCategories.id),
  // 'junk' is the only supported food type for now
  linked_food_type: text("linked_food_type"),
  result: text("result").$type<EliminationResultEnum>(),
  notes: text("notes"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const scoreHistory = sqliteTable("score_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  // 'weekly' | 'quarterly' | 'yearly'
  period_type: text("period_type").notNull(),
  // ISO date of period start (Monday for weekly, quarter start for quarterly)
  period_start: text("period_start").notNull(),
  score: real("score").notNull(),
  // Snapshot of component scores (JSON)
  component_scores: text("component_scores"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const decisionLogs = sqliteTable("decision_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  week_start: text("week_start").notNull(),
  description: text("description").notNull(),
  // 'aligned' | 'misaligned' | 'neutral'
  alignment: text("alignment").notNull().default("neutral"),
  // Quest this decision relates to (optional)
  related_quest_id: text("related_quest_id").references(() => quests.id),
  // Source: 'ai_detected' | 'user_reported'
  source: text("source").notNull().default("user_reported"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const habitLogExtractions = sqliteTable("habit_log_extractions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  daily_log_id: integer("daily_log_id")
    .notNull()
    .references(() => dailyLogs.id),
  date: text("date").notNull(),
  // Habit name e.g. 'meditation', 'porn', 'gym'
  habit_key: text("habit_key").notNull(),
  // true = occurred, false = explicitly did not occur
  occurred: integer("occurred").notNull().default(1),
  // Raw text snippet from the log that triggered this extraction
  source_text: text("source_text"),
  // 'ai' | 'manual'
  source_type: text("source_type").notNull().default("ai"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── TYPE EXPORTS ─────────────────────────────────────────────────────────────

export type MoneyCategory = typeof moneyCategories.$inferSelect;
export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type OAuthAuthCode = typeof oauthAuthCodes.$inferSelect;
export type FoodLog = typeof foodLogs.$inferSelect;
export type ExpenseLog = typeof expenseLogs.$inferSelect;
export type TimeLog = typeof timeLogs.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type DepositLog = typeof depositLogs.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type RecurringTransactionItem =
  typeof recurringTransactionItems.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type DebtRepayment = typeof debtRepayments.$inferSelect;
export type TransferLog = typeof transferLogs.$inferSelect;
export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type BodyMeasurementLog = typeof bodyMeasurementLogs.$inferSelect;
export type TimeBucket = typeof timeBuckets.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type QuestMilestone = typeof questMilestones.$inferSelect;
export type QuestTask = typeof questTasks.$inferSelect;
export type InvestmentAccount = typeof investmentAccounts.$inferSelect;
export type InvestmentAsset = typeof investmentAssets.$inferSelect;
export type InvestmentCashFlow = typeof investmentCashFlows.$inferSelect;
export type AssetValueSnapshot = typeof assetValueSnapshots.$inferSelect;
export type QuestXpEvent = typeof questXpEvents.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserStreak = typeof userStreaks.$inferSelect;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type TrajectoryConfig = typeof trajectoryConfig.$inferSelect;
export type WeeklyCheckin = typeof weeklyCheckins.$inferSelect;
export type GoalChangeRequest = typeof goalChangeRequests.$inferSelect;
export type EliminationItem = typeof eliminationItems.$inferSelect;
export type ScoreHistory = typeof scoreHistory.$inferSelect;
export type DecisionLog = typeof decisionLogs.$inferSelect;
export type HabitLogExtraction = typeof habitLogExtractions.$inferSelect;
