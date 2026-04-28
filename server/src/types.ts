export interface Env {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  FRONTEND_URL: string;
}

export interface Variables {
  userId: string;
  clerkUserId: string;
  correlationId: string;
}
