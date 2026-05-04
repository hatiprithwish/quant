export class AppConstants {
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

  static readonly EXPENSE_CATEGORIES = [
    "food-groceries",
    "eating-out",
    "transport",
    "shopping",
    "entertainment",
    "health",
    "subscriptions",
    "utilities",
    "other",
  ] as const;

  static readonly LOG_CATEGORIES = {
    HTTP: "HTTP",
    DATABASE: "DATABASE",
    AUTH: "AUTH",
    MCP: "MCP",
    CRON: "CRON",
  } as const;
}
