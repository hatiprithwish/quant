import { createMiddleware } from "hono/factory";
import { Env, Variables } from "../types";

export const generalRateLimiter = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const key = c.get("userId") ?? c.req.header("CF-Connecting-IP") ?? "unknown";
  if (c.env.RATE_LIMITER_GENERAL) {
    const { success } = await c.env.RATE_LIMITER_GENERAL.limit({ key });
    if (!success) {
      return c.json({ isSuccess: false, message: "Too many requests" }, 429);
    }
  }
  return next();
});

export const authRateLimiter = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const key = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (c.env.RATE_LIMITER_AUTH) {
    const { success } = await c.env.RATE_LIMITER_AUTH.limit({ key });
    if (!success) {
      return c.json({ isSuccess: false, message: "Too many requests" }, 429);
    }
  }
  return next();
});
