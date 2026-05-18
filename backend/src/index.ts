import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env, Variables } from "./types";
import { correlationIdMiddleware } from "./middlewares/correlationId";
import { authRoutes } from "./routes/AuthRoutes";
import { foodRoutes } from "./routes/FoodRoutes";
import { expenseRoutes } from "./routes/ExpenseRoutes";
import { timeRoutes } from "./routes/TimeRoutes";
import { dailyLogRoutes } from "./routes/DailyLogRoutes";
import { oauthRoutes } from "./routes/OAuthRoutes";
import { walletRoutes } from "./routes/WalletRoutes";
import { walletMutationRoutes } from "./routes/WalletMutationRoutes";
import { entryRoutes } from "./routes/EntryRoutes";
import { transactionQueryRoutes } from "./routes/TransactionQueryRoutes";
import { budgetRoutes } from "./routes/BudgetRoutes";
import { budgetMutationRoutes } from "./routes/BudgetMutationRoutes";
import { recurringTransactionRoutes } from "./routes/RecurringTransactionRoutes";
import { recurringTransactionMutationRoutes } from "./routes/RecurringTransactionMutationRoutes";
import { debtRoutes, debtMutationRoutes } from "./routes/DebtRoutes";
import { bodyRoutes } from "./routes/BodyRoutes";
import { bodyMutationRoutes } from "./routes/BodyMutationRoutes";
import { questsRoutes } from "./routes/QuestsRoutes";
import { questsMutationRoutes } from "./routes/QuestsMutationRoutes";
import { timeBucketsRoutes } from "./routes/TimeBucketsRoutes";
import { timeEntryRoutes } from "./routes/TimeEntryRoutes";
import { moneyCategoryRoutes } from "./routes/MoneyCategoryRoutes";
import { investmentRoutes } from "./routes/InvestmentRoutes";
import { trajectoryRoutes } from "./routes/TrajectoryRoutes";
import { habitRoutes } from "./routes/HabitRoutes";
import { handleMcpRequest } from "./mcp";
import { getDb } from "./db";
import { ApiKeyDAL } from "./data-access-layer/ApiKeyDAL";
import { Logger } from "./config/Logger";
import { AppConstants } from "./config/Constants";
import {
  processRecurringTransactions,
  createDailyLogs,
  weeklyCheckinPrompt,
  weeklyScoreCompute,
  missedCheckinPenalty,
  achievementCheck,
} from "./providers/CronTriggers";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowHeaders: ["Content-Type", "Authorization", "Mcp-Session-Id"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS", "PATCH"],
    exposeHeaders: ["Mcp-Session-Id"],
    credentials: true,
  }),
);

app.use("*", correlationIdMiddleware);

app.get("/health", (c) =>
  c.json({ isSuccess: true, message: "Life Tracker MCP Server is running" }),
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

app.get("/mcp/.well-known/oauth-protected-resource", (c) => {
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
  return c.json(
    {
      client_id: clientId,
      client_name: body.client_name ?? "Claude",
      redirect_uris: body.redirect_uris ?? [],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      registration_client_uri: `${base}/register/${clientId}`,
    },
    201,
  );
});

app.route("/api/auth", authRoutes);
app.route("/api/query/food", foodRoutes);
app.route("/api/query/expenses", expenseRoutes);
app.route("/api/query/time", timeRoutes);
app.route("/api/daily-log", dailyLogRoutes);
app.route("/oauth", oauthRoutes);
app.route("/api/query/wallets", walletRoutes);
app.route("/api/wallet", walletMutationRoutes);
app.route("/api/entry", entryRoutes);
app.route("/api/query/transactions", transactionQueryRoutes);
app.route("/api/query/budgets", budgetRoutes);
app.route("/api/budget", budgetMutationRoutes);
app.route("/api/query/recurring-transactions", recurringTransactionRoutes);
app.route("/api/recurring-transaction", recurringTransactionMutationRoutes);
app.route("/api/query/debts", debtRoutes);
app.route("/api/debt", debtMutationRoutes);
app.route("/api/query/body", bodyRoutes);
app.route("/api/body", bodyMutationRoutes);
app.route("/api/query/quests", questsRoutes);
app.route("/api/quest", questsMutationRoutes);
app.route("/api/time-bucket", timeBucketsRoutes);
app.route("/api/time-entry", timeEntryRoutes);
app.route("/api/money-category", moneyCategoryRoutes);
app.route("/api/investments", investmentRoutes);
app.route("/api/trajectory", trajectoryRoutes);
app.route("/api/habits", habitRoutes);

app.all("/mcp", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const base = new URL(c.req.url).origin;
  const wwwAuthenticate = `Bearer realm="${base}", resource_metadata="${base}/.well-known/oauth-protected-resource"`;

  const authHeader = c.req.header("Authorization");
  const apiKey = authHeader?.replace("Bearer ", "").trim();

  if (!apiKey) {
    return c.json({ isSuccess: false, message: "Unauthorized" }, 401, {
      "WWW-Authenticate": wwwAuthenticate,
    });
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
    return c.json({ isSuccess: false, message: "Unauthorized" }, 401, {
      "WWW-Authenticate": wwwAuthenticate,
    });
  }

  Logger.info({
    correlationId,
    logCategory: AppConstants.LOG_CATEGORIES.MCP,
    logAction: "McpRequest",
    message: "MCP request received",
    metadata: { userId, method: c.req.method },
  });

  return handleMcpRequest(c.req.raw, userId, c.env, correlationId);
});

export default {
  fetch: app.fetch.bind(app),
  scheduled: async (controller: ScheduledController, env: Env, ctx: ExecutionContext) => {
    const db = getDb(env.DB);
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 3=Wed
    const hour = now.getUTCHours();

    const jobs: Promise<void>[] = [
      processRecurringTransactions(db),
      createDailyLogs(db),
    ];

    // Monday (day=1) around 8am UTC: weekly check-in prompt
    if (dayOfWeek === 1 && hour >= 8 && hour < 10) {
      jobs.push(weeklyCheckinPrompt(db));
    }

    // Wednesday (day=3) around 9am UTC: missed check-in penalty
    if (dayOfWeek === 3 && hour >= 9 && hour < 11) {
      jobs.push(missedCheckinPenalty(db));
    }

    // Sunday (day=0) around 23:00 UTC: score compute + achievement check
    if (dayOfWeek === 0 && hour >= 23) {
      jobs.push(
        weeklyScoreCompute(db, env.AI).then(() => achievementCheck(db)),
      );
    }

    ctx.waitUntil(Promise.all(jobs));
  },
};
