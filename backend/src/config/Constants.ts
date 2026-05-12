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

  // D1 hard limit: 100 bound parameters per statement.
  static readonly D1_INSERT_CHUNK_SIZES = {
    TIME: 16,    // 6 params/row
    EXPENSE: 14, // 7 params/row
    FOOD: 10,    // 10 params/row
    BODY_LOG: 20, // 5 params/row
  } as const;
}
