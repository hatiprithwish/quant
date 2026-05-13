import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { generalRateLimiter } from "../middlewares/rateLimiter";
import { InvestmentRepo } from "../repos/InvestmentRepo";
import { InvestmentDAL } from "../data-access-layer/InvestmentDAL";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import {
  ZCreateInvestmentAccountRequest,
  ZUpdateInvestmentAccountRequest,
  ZCreateInvestmentAssetRequest,
  ZUpdateInvestmentAssetRequest,
  ZAddCashFlowRequest,
  ZUpdateAssetValueRequest,
} from "../schemas";
import { z } from "zod";

const ZIdParam = z.object({ id: z.coerce.number().int().positive() });

const investmentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
investmentRoutes.use("*", clerkAuthMiddleware, generalRateLimiter);

// GET /api/investments
investmentRoutes.get("/", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.getInvestments(userId, db);
    return c.json(result, 200);
  } catch (err) {
    Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetInvestmentsFailure", message: "Failed", error: err });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// POST /api/investments/accounts
investmentRoutes.post("/accounts", zValidator("json", ZCreateInvestmentAccountRequest), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.createAccount(userId, body, db);
    return c.json(result, 201);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// PATCH /api/investments/accounts/:id
investmentRoutes.patch("/accounts/:id", zValidator("param", ZIdParam), zValidator("json", ZUpdateInvestmentAccountRequest), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.updateAccount(userId, id, body, db);
    return c.json(result, 200);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// DELETE /api/investments/accounts/:id
investmentRoutes.delete("/accounts/:id", zValidator("param", ZIdParam), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.deleteAccount(userId, id, db);
    return c.json(result, 200);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// POST /api/investments/accounts/:id/assets
investmentRoutes.post("/accounts/:id/assets", zValidator("param", ZIdParam), zValidator("json", ZCreateInvestmentAssetRequest), async (c) => {
  const userId = c.get("userId");
  const { id: accountId } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);
  try {
    const acc = await InvestmentDAL.findAccountById(accountId, userId, db);
    if (!acc) return c.json({ isSuccess: false, message: "Account not found" }, 404);
    const result = await InvestmentRepo.createAsset(accountId, body, db);
    return c.json(result, 201);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// PATCH /api/investments/assets/:id
investmentRoutes.patch("/assets/:id", zValidator("param", ZIdParam), zValidator("json", ZUpdateInvestmentAssetRequest), async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.updateAsset(id, body, db);
    return c.json(result, 200);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// DELETE /api/investments/assets/:id
investmentRoutes.delete("/assets/:id", zValidator("param", ZIdParam), async (c) => {
  const { id } = c.req.valid("param");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.deleteAsset(id, db);
    return c.json(result, 200);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// POST /api/investments/assets/:id/cashflows
investmentRoutes.post("/assets/:id/cashflows", zValidator("param", ZIdParam), zValidator("json", ZAddCashFlowRequest), async (c) => {
  const { id: assetId } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.addCashFlow(assetId, body, db);
    return c.json(result, 201);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// DELETE /api/investments/cashflows/:id
investmentRoutes.delete("/cashflows/:id", zValidator("param", ZIdParam), async (c) => {
  const { id } = c.req.valid("param");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.deleteCashFlow(id, db);
    return c.json(result, 200);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// POST /api/investments/assets/:id/value
investmentRoutes.post("/assets/:id/value", zValidator("param", ZIdParam), zValidator("json", ZUpdateAssetValueRequest), async (c) => {
  const { id: assetId } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);
  try {
    const result = await InvestmentRepo.updateAssetValue(assetId, body, db);
    return c.json(result, 201);
  } catch (err) {
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { investmentRoutes };
