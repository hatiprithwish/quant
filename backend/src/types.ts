export interface Env {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  FRONTEND_URL: string;
  RATE_LIMITER_GENERAL: RateLimit;
  RATE_LIMITER_AUTH: RateLimit;
}

export interface Variables {
  userId: string;
  clerkUserId: string;
  correlationId: string;
}
