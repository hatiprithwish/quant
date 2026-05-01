import { createMiddleware } from "hono/factory";
import { verifyToken } from "@clerk/backend";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { UserDAL } from "../data-access-layer/UserDAL";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

export const clerkAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ isSuccess: false, message: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    const db = getDb(c.env.DB);
    const user = await UserDAL.findByClerkId(payload.sub, db);

    if (!user || user.deleted_at) {
      return c.json({ isSuccess: false, message: "User not found" }, 401);
    }

    c.set("clerkUserId", payload.sub);
    c.set("userId", user.id);
    await next();
    return;
  } catch (err) {
    Logger.warn({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.AUTH,
      logAction: "ClerkTokenVerificationFailure",
      message: "Clerk JWT verification failed",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Unauthorized" }, 401);
  }
});
