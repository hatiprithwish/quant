import { DrizzleDb } from "../db";
import { WalletDAL } from "../data-access-layer/WalletDAL";
import { DepositDAL } from "../data-access-layer/DepositDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import {
  WalletQueryRepoRequest,
  GetWalletsResponse,
  CreateWalletRepoRequest,
  CreateWalletResponse,
  UpdateWalletRepoRequest,
  UpdateWalletResponse,
  WalletRecordCountResponse,
  WalletWithBalance,
  MoneyCategoryTypeEnum,
} from "../schemas";

function toWalletWithBalance(row: {
  id: number;
  name: string;
  type: string;
  credit_limit: number | null;
  active: number;
  balance: number;
}): WalletWithBalance {
  return {
    id: row.id,
    name: row.name,
    type: row.type as WalletWithBalance["type"],
    credit_limit: row.credit_limit,
    active: row.active === 1,
    balance: row.balance,
  };
}

export class WalletRepo {
  static async getWallets(
    req: WalletQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetWalletsResponse> {
    const rows = await WalletDAL.findAllWithBalance({ userId: req.userId }, db);
    return {
      isSuccess: true,
      message: "Wallets retrieved",
      wallets: rows.map(toWalletWithBalance),
    };
  }

  static async createWallet(
    req: CreateWalletRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateWalletResponse> {
    const row = await WalletDAL.insert(
      {
        userId: req.userId,
        name: req.name,
        type: req.type,
        credit_limit: req.credit_limit ?? null,
      },
      db,
    );

    if (req.initial_balance && req.initial_balance > 0) {
      const incomeCategories = await MoneyCategoryDAL.findByType(req.userId, MoneyCategoryTypeEnum.Income, db);
      const openingBalanceCat = incomeCategories.find((c) => c.name === "opening_balance") ?? incomeCategories[0];
      if (openingBalanceCat) {
        await DepositDAL.insert(
          {
            userId: req.userId,
            walletId: row.id,
            date: new Date().toISOString().split("T")[0],
            amount: req.initial_balance,
            currency: "INR",
            categoryId: openingBalanceCat.id,
            description: "Opening balance",
          },
          db,
        );
      }
    }

    const updatedRows = await WalletDAL.findAllWithBalance(
      { userId: req.userId },
      db,
    );
    const updated = updatedRows.find((r) => r.id === row.id)!;

    return {
      isSuccess: true,
      message: "Wallet created",
      wallet: toWalletWithBalance(updated),
    };
  }

  static async updateWallet(
    req: UpdateWalletRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateWalletResponse> {
    const row = await WalletDAL.update(
      req.id,
      req.userId,
      {
        name: req.name,
        type: req.type,
        credit_limit: req.credit_limit,
      },
      db,
    );

    if (!row) {
      return { isSuccess: false, message: "Wallet not found", wallet: null as never };
    }

    if (req.current_balance !== undefined) {
      const allRows = await WalletDAL.findAllWithBalance({ userId: req.userId }, db);
      const currentRow = allRows.find((r) => r.id === req.id);
      const currentBalance = currentRow?.balance ?? 0;
      const adjustment = req.current_balance - currentBalance;

      if (adjustment !== 0) {
        const openingDeposit = await DepositDAL.findOpeningBalance(req.id, req.userId, db);
        if (openingDeposit) {
          const newAmount = openingDeposit.amount + adjustment;
          if (newAmount >= 0) {
            await DepositDAL.update(openingDeposit.id, req.userId, { amount: newAmount }, db);
          } else {
            await DepositDAL.update(openingDeposit.id, req.userId, { amount: 0 }, db);
          }
        } else {
          const incomeCategories = await MoneyCategoryDAL.findByType(req.userId, MoneyCategoryTypeEnum.Income, db);
          const openingBalanceCat = incomeCategories.find((c) => c.name === "opening_balance") ?? incomeCategories[0];
          if (openingBalanceCat && adjustment > 0) {
            await DepositDAL.insert(
              {
                userId: req.userId,
                walletId: req.id,
                date: new Date().toISOString().split("T")[0],
                amount: adjustment,
                currency: "INR",
                categoryId: openingBalanceCat.id,
                description: "Opening balance",
              },
              db,
            );
          }
        }
      }
    }

    const updatedRows = await WalletDAL.findAllWithBalance(
      { userId: req.userId },
      db,
    );
    const updated = updatedRows.find((r) => r.id === row.id);
    if (!updated) {
      return { isSuccess: false, message: "Wallet not found", wallet: null as never };
    }

    return {
      isSuccess: true,
      message: "Wallet updated",
      wallet: toWalletWithBalance(updated),
    };
  }

  static async getRecordCount(
    id: number,
    db: DrizzleDb,
  ): Promise<WalletRecordCountResponse> {
    const count = await WalletDAL.countLinkedRecords(id, db);
    return { isSuccess: true, message: "Count retrieved", count };
  }

  static async deleteWallet(
    id: number,
    userId: string,
    db: DrizzleDb,
  ): Promise<{ isSuccess: boolean; message: string }> {
    const wallet = await WalletDAL.findById(id, userId, db);
    if (!wallet) {
      return { isSuccess: false, message: "Wallet not found" };
    }
    await WalletDAL.softDelete(id, userId, db);
    return { isSuccess: true, message: "Wallet deleted" };
  }
}
