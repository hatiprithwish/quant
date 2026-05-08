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

  static readonly LOG_CATEGORIES = {
    HTTP: "HTTP",
    DATABASE: "DATABASE",
    AUTH: "AUTH",
    MCP: "MCP",
    CRON: "CRON",
  } as const;

  // D1 hard limit: 100 bound parameters per statement.
  static readonly D1_INSERT_CHUNK_SIZES = {
    TIME: 16,    // 6 params/row
    EXPENSE: 14, // 7 params/row
    FOOD: 10,    // 10 params/row
    BODY_LOG: 20, // 5 params/row
  } as const;
}
