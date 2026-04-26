import { createMiddleware } from "hono/factory";
import { Variables, Env } from "../types";

export const correlationIdMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const id = crypto.randomUUID();
  c.set("correlationId", id);
  c.header("X-Correlation-Id", id);
  await next();
});
