import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env, Variables } from "./types";
import { correlationIdMiddleware } from "./middlewares/correlationId";
import { authRoutes } from "./routes/AuthRoutes";
import { foodRoutes } from "./routes/FoodRoutes";
import { expenseRoutes } from "./routes/ExpenseRoutes";
import { timeRoutes } from "./routes/TimeRoutes";
import { scratchpadRoutes } from "./routes/ScratchpadRoutes";
import { oauthRoutes } from "./routes/OAuthRoutes";
import { handleMcpRequest } from "./mcp";
import { getDb } from "./db";
import { ApiKeyDAL } from "./data-access-layer/ApiKeyDAL";
import { Logger } from "./config/Logger";
import { AppConstants } from "./config/Constants";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowHeaders: ["Content-Type", "Authorization", "Mcp-Session-Id"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    exposeHeaders: ["Mcp-Session-Id"],
    credentials: true,
  })
);

app.use("*", correlationIdMiddleware);

app.get("/health", (c) =>
  c.json({ isSuccess: true, message: "Life Tracker MCP Server is running" })
);

app.get("/.well-known/oauth-authorization-server", (c) => {
  const base = new URL(c.req.url).origin;
  return c.json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
});

app.get("/.well-known/oauth-protected-resource", (c) => {
  const base = new URL(c.req.url).origin;
  return c.json({
    resource: `${base}/mcp`,
    authorization_servers: [base],
    bearer_methods_supported: ["header"],
  });
});

app.get("/.well-known/oauth-protected-resource/mcp", (c) => {
  const base = new URL(c.req.url).origin;
  return c.json({
    resource: `${base}/mcp`,
    authorization_servers: [base],
    bearer_methods_supported: ["header"],
  });
});

app.post("/register", async (c) => {
  const base = new URL(c.req.url).origin;
  const body = await c.req.json().catch(() => ({}));
  const clientId = crypto.randomUUID();
  return c.json({
    client_id: clientId,
    client_name: body.client_name ?? "Claude",
    redirect_uris: body.redirect_uris ?? [],
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    registration_client_uri: `${base}/register/${clientId}`,
  }, 201);
});

app.route("/api/auth", authRoutes);
app.route("/api/query/food", foodRoutes);
app.route("/api/query/expenses", expenseRoutes);
app.route("/api/query/time", timeRoutes);
app.route("/api/scratchpad", scratchpadRoutes);
app.route("/oauth", oauthRoutes);

app.all("/mcp", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const authHeader = c.req.header("Authorization");
  const apiKey = authHeader?.replace("Bearer ", "").trim();

  if (!apiKey) {
    return c.json({ isSuccess: false, message: "Unauthorized" }, 401);
  }

  const db = getDb(c.env.DB);
  const userId = await ApiKeyDAL.getUserIdByKey(apiKey, db);

  if (!userId) {
    Logger.warn({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.AUTH,
      logAction: "McpApiKeyInvalid",
      message: "Invalid MCP API key",
    });
    return c.json({ isSuccess: false, message: "Unauthorized" }, 401);
  }

  Logger.info({
    correlationId,
    logCategory: AppConstants.LOG_CATEGORIES.MCP,
    logAction: "McpRequest",
    message: "MCP request received",
    metadata: { userId, method: c.req.method },
  });

  return handleMcpRequest(c.req.raw, userId, c.env);
});

export default app;
