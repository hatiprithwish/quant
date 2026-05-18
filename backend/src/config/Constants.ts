export class AppConstants {
  static readonly PALETTE = [
    "#06b6d4", // cyan
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#10b981", // emerald
    "#3b82f6", // blue
    "#6b7280", // gray
  ] as const;

  static readonly PAGINATION = {
    DEFAULT_LIMIT: 500,
  } as const;

  static readonly API_KEY = {
    BYTE_LENGTH: 32,
  } as const;

  static readonly BUCKETS = [
    "career",
    "sleep",
    "maintenance",
    "fitness",
    "learning",
    "social",
    "entertainment",
    "personal-dev",
  ] as const;

  static readonly LOG_CATEGORIES = {
    HTTP: "HTTP",
    DATABASE: "DATABASE",
    AUTH: "AUTH",
    MCP: "MCP",
    CRON: "CRON",
  } as const;

  static readonly TRAJECTORY = {
    QUARTERLY_CAP: 3,
    COOLING_OFF_HOURS: 30,
    GOAL_CHANGE_XP_PENALTY: 500,
    MISSED_CHECKIN_XP_PENALTY: 100,
  } as const;

  static readonly ACHIEVEMENTS = {
    VAULT_COMPLETE: "VAULT_COMPLETE",
    FIRST_CHECKIN: "FIRST_CHECKIN",
    CHECKIN_STREAK_4: "CHECKIN_STREAK_4",
    WEEKLY_SCORE_70: "WEEKLY_SCORE_70",
    WEEKLY_SCORE_90: "WEEKLY_SCORE_90",
    Q_MILESTONE_DONE: "Q_MILESTONE_DONE",
    YEAR_MILESTONE_DONE: "YEAR_MILESTONE_DONE",
    STABILITY_QUARTER: "STABILITY_QUARTER",
    STREAK_4_WEEKS_70: "STREAK_4_WEEKS_70",
    FULL_ALIGNMENT_WEEK: "FULL_ALIGNMENT_WEEK",
    FINANCIAL_DISCIPLINE_4W: "FINANCIAL_DISCIPLINE_4W",
    DEEP_WORK_WEEK: "DEEP_WORK_WEEK",
    HEALTH_AND_HUSTLE: "HEALTH_AND_HUSTLE",
    ESCAPE_10PCT: "ESCAPE_10PCT",
    ESCAPE_25PCT: "ESCAPE_25PCT",
    ESCAPE_50PCT: "ESCAPE_50PCT",
    INCOME_DOUBLED: "INCOME_DOUBLED",
    INCOME_5X: "INCOME_5X",
    FIRST_PAYING_CUSTOMER: "FIRST_PAYING_CUSTOMER",
    ZERO_JUNK_WEEK: "ZERO_JUNK_WEEK",
    ZERO_DISTRACTION_WEEK: "ZERO_DISTRACTION_WEEK",
    NO_IMPULSE_MONTH: "NO_IMPULSE_MONTH",
  } as const;

  static readonly ACHIEVEMENT_XP: Record<string, number> = {
    VAULT_COMPLETE: 200,
    FIRST_CHECKIN: 50,
    CHECKIN_STREAK_4: 100,
    WEEKLY_SCORE_70: 30,
    WEEKLY_SCORE_90: 60,
    Q_MILESTONE_DONE: 200,
    YEAR_MILESTONE_DONE: 500,
    STABILITY_QUARTER: 150,
    STREAK_4_WEEKS_70: 100,
    FULL_ALIGNMENT_WEEK: 100,
    FINANCIAL_DISCIPLINE_4W: 150,
    DEEP_WORK_WEEK: 80,
    HEALTH_AND_HUSTLE: 60,
    ESCAPE_10PCT: 500,
    ESCAPE_25PCT: 500,
    ESCAPE_50PCT: 500,
    INCOME_DOUBLED: 300,
    INCOME_5X: 1000,
    FIRST_PAYING_CUSTOMER: 500,
    ZERO_JUNK_WEEK: 50,
    ZERO_DISTRACTION_WEEK: 80,
    NO_IMPULSE_MONTH: 100,
  } as const;

  // D1 hard limit: 100 bound parameters per statement.
  static readonly D1_INSERT_CHUNK_SIZES = {
    TIME: 16,       // 6 params/row
    EXPENSE: 14,    // 7 params/row
    FOOD: 10,       // 10 params/row
    BODY_LOG: 20,   // 5 params/row
    FOOD_ITEMS: 5,  // 20 params/row
  } as const;

  static readonly USDA_NUTRIENT_IDS = {
    ENERGY: 1008, PROTEIN: 1003, CARBS: 1005, FAT: 1004, FIBER: 1079,
    SUGAR: 2000, SODIUM: 1093, SATURATED_FAT: 1258, CHOLESTEROL: 1253,
    TRANS_FAT: 1257, POTASSIUM: 1092, VITAMIN_A: 1106, VITAMIN_C: 1162,
    VITAMIN_D: 1114, VITAMIN_B12: 1178, CALCIUM: 1087, IRON: 1089,
  } as const;

  static readonly NUTRITION_APIS = {
    USDA_BASE: "https://api.nal.usda.gov/fdc/v1",
    OFF_BASE: "https://world.openfoodfacts.org/cgi/search.pl",
  } as const;
}
