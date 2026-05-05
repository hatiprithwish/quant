import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { EntryRepo } from "../repos/EntryRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import {
  ZCreateExpenseRequest,
  ZUpdateExpenseRequest,
  ZCreateDepositRequest,
  ZUpdateDepositRequest,
  ZCreateTransferRequest,
  ZUpdateTransferRequest,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const entryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Expense ──────────────────────────────────────────────────────────────────

entryRoutes.post(
  "/expense",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateExpenseRequest),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await EntryRepo.createExpense({ ...body, userId }, db);
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateExpenseFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

entryRoutes.patch(
  "/expense/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateExpenseRequest),
  async (c) => {
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await EntryRepo.updateExpense({ ...body, userId, id }, db);
      if (!result.isSuccess) return c.json(result, 404);
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateExpenseFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

entryRoutes.delete(
  "/expense/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await EntryRepo.deleteExpense(id, userId, db);
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteExpenseFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Income (Deposit) ──────────────────────────────────────────────────────────

entryRoutes.post(
  "/income",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateDepositRequest),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await EntryRepo.createDeposit({ ...body, userId }, db);
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateDepositFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

entryRoutes.patch(
  "/income/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateDepositRequest),
  async (c) => {
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await EntryRepo.updateDeposit({ ...body, userId, id }, db);
      if (!result.isSuccess) return c.json(result, 404);
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateDepositFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

entryRoutes.delete(
  "/income/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await EntryRepo.deleteDeposit(id, userId, db);
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteDepositFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Transfer ──────────────────────────────────────────────────────────────────

entryRoutes.post(
  "/transfer",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateTransferRequest),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await EntryRepo.createTransfer({ ...body, userId }, db);
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateTransferFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

entryRoutes.patch(
  "/transfer/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateTransferRequest),
  async (c) => {
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await EntryRepo.updateTransfer({ ...body, userId, id }, db);
      if (!result.isSuccess) return c.json(result, 404);
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateTransferFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

entryRoutes.delete(
  "/transfer/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await EntryRepo.deleteTransfer(id, userId, db);
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteTransferFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { entryRoutes };
