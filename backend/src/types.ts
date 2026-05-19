export interface Env {
  DB: D1Database;
  AI: Ai;
  BROWSER: Fetcher;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  FRONTEND_URL: string;
  USDA_API_KEY: string;
  RATE_LIMITER_GENERAL: RateLimit;
  RATE_LIMITER_AUTH: RateLimit;
}

export interface Variables {
  userId: string;
  clerkUserId: string;
  correlationId: string;
}
