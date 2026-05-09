import { DrizzleDb } from "../db";
import { ExpenseDAL } from "../data-access-layer/ExpenseDAL";
import { DepositDAL } from "../data-access-layer/DepositDAL";
import { TransferDAL } from "../data-access-layer/TransferDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import {
  CreateExpenseRepoRequest,
  UpdateExpenseRepoRequest,
  CreateDepositRepoRequest,
  UpdateDepositRepoRequest,
  CreateTransferRepoRequest,
  UpdateTransferRepoRequest,
  CreateTransferResponse,
  UpdateTransferResponse,
  CreateDepositResponse,
  UpdateDepositResponse,
  MoneyCategoryItem,
  MoneyCategoryTypeEnum,
} from "../schemas";

function toMoneyCategoryItem(row: { id: number; name: string; display_label: string; color: string; type: string }): MoneyCategoryItem {
  return { id: row.id, name: row.name, display_label: row.display_label, color: row.color, type: row.type as MoneyCategoryTypeEnum };
}

export class EntryRepo {
  // ── Expense ───────────────────────────────────────────────────────────────

  static async createExpense(req: CreateExpenseRepoRequest, db: DrizzleDb) {
    const row = await ExpenseDAL.insertOne(
      {
        userId: req.userId,
        date: req.date,
        amount: req.amount,
        currency: req.currency ?? "INR",
        categoryId: req.category_id,
        description: req.description ?? null,
        walletId: req.wallet_id,
      },
      db,
    );
    const cat = await MoneyCategoryDAL.findById(row.category_id, req.userId, db);
    return {
      isSuccess: true,
      message: "Expense logged",
      expense: {
        id: row.id,
        date: row.date,
        amount: row.amount,
        currency: row.currency,
        category: toMoneyCategoryItem(cat!),
        description: row.description,
        wallet_id: row.wallet_id,
      },
    };
  }

  static async updateExpense(req: UpdateExpenseRepoRequest, db: DrizzleDb) {
    const row = await ExpenseDAL.update(
      req.id,
      req.userId,
      {
        date: req.date,
        amount: req.amount,
        currency: req.currency,
        categoryId: req.category_id,
        description: req.description,
        walletId: req.wallet_id,
      },
      db,
    );
    if (!row) return { isSuccess: false, message: "Expense not found" };
    const cat = await MoneyCategoryDAL.findById(row.category_id, req.userId, db);
    return {
      isSuccess: true,
      message: "Expense updated",
      expense: {
        id: row.id,
        date: row.date,
        amount: row.amount,
        currency: row.currency,
        category: toMoneyCategoryItem(cat!),
        description: row.description,
        wallet_id: row.wallet_id,
      },
    };
  }

  static async deleteExpense(id: number, userId: string, db: DrizzleDb) {
    await ExpenseDAL.delete(id, userId, db);
    return { isSuccess: true, message: "Expense deleted" };
  }

  // ── Income (Deposit) ──────────────────────────────────────────────────────

  static async createDeposit(
    req: CreateDepositRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateDepositResponse> {
    const row = await DepositDAL.insert(
      {
        userId: req.userId,
        walletId: req.wallet_id,
        date: req.date,
        amount: req.amount,
        currency: req.currency ?? "INR",
        categoryId: req.category_id,
        description: req.description ?? null,
      },
      db,
    );
    const cat = await MoneyCategoryDAL.findById(row.category_id, req.userId, db);
    return {
      isSuccess: true,
      message: "Income logged",
      deposit: {
        id: row.id,
        wallet_id: row.wallet_id,
        date: row.date,
        amount: row.amount,
        currency: row.currency,
        category: toMoneyCategoryItem(cat!),
        description: row.description,
      },
    };
  }

  static async updateDeposit(
    req: UpdateDepositRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateDepositResponse> {
    const row = await DepositDAL.update(
      req.id,
      req.userId,
      {
        walletId: req.wallet_id,
        date: req.date,
        amount: req.amount,
        currency: req.currency,
        categoryId: req.category_id,
        description: req.description,
      },
      db,
    );
    if (!row) return { isSuccess: false, message: "Income not found", deposit: null as never };
    const cat = await MoneyCategoryDAL.findById(row.category_id, req.userId, db);
    return {
      isSuccess: true,
      message: "Income updated",
      deposit: {
        id: row.id,
        wallet_id: row.wallet_id,
        date: row.date,
        amount: row.amount,
        currency: row.currency,
        category: toMoneyCategoryItem(cat!),
        description: row.description,
      },
    };
  }

  static async deleteDeposit(id: number, userId: string, db: DrizzleDb) {
    await DepositDAL.delete(id, userId, db);
    return { isSuccess: true, message: "Income deleted" };
  }

  // ── Transfer ──────────────────────────────────────────────────────────────

  static async createTransfer(
    req: CreateTransferRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateTransferResponse> {
    const row = await TransferDAL.insert(
      {
        userId: req.userId,
        fromWalletId: req.from_wallet_id,
        toWalletId: req.to_wallet_id,
        amount: req.amount,
        currency: req.currency ?? "INR",
        description: req.description ?? null,
        date: req.date,
      },
      db,
    );
    return {
      isSuccess: true,
      message: "Transfer logged",
      transfer: {
        id: row.id,
        from_wallet_id: row.from_wallet_id,
        to_wallet_id: row.to_wallet_id,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        date: row.date,
      },
    };
  }

  static async updateTransfer(
    req: UpdateTransferRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateTransferResponse> {
    const row = await TransferDAL.update(
      req.id,
      req.userId,
      {
        fromWalletId: req.from_wallet_id,
        toWalletId: req.to_wallet_id,
        amount: req.amount,
        currency: req.currency,
        description: req.description,
        date: req.date,
      },
      db,
    );
    if (!row) return { isSuccess: false, message: "Transfer not found", transfer: null as never };
    return {
      isSuccess: true,
      message: "Transfer updated",
      transfer: {
        id: row.id,
        from_wallet_id: row.from_wallet_id,
        to_wallet_id: row.to_wallet_id,
        amount: row.amount,
        currency: row.currency,
        description: row.description,
        date: row.date,
      },
    };
  }

  static async deleteTransfer(id: number, userId: string, db: DrizzleDb) {
    await TransferDAL.delete(id, userId, db);
    return { isSuccess: true, message: "Transfer deleted" };
  }
}
