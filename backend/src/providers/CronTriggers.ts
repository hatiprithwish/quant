import { eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { recurringTransactionItems, transferLogs, investmentCashFlows, assetValueSnapshots } from "../db/tables";
import { RecurringTransactionDAL } from "../data-access-layer/RecurringTransactionDAL";
import { ExpenseDAL } from "../data-access-layer/ExpenseDAL";
import { DepositDAL } from "../data-access-layer/DepositDAL";
import { InvestmentDAL } from "../data-access-layer/InvestmentDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import {
  RecurringTransactionPeriodEnum,
  RecurringEndConditionEnum,
  MoneyCategoryTypeEnum,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

function advanceDate(
  current: string,
  period: RecurringTransactionPeriodEnum,
  interval: number,
  weekDays: number[] | null,
  monthEnd: boolean,
): string {
  const d = new Date(current + "T00:00:00Z");

  if (period === RecurringTransactionPeriodEnum.Weekly) {
    if (weekDays && weekDays.length > 0) {
      const sorted = [...weekDays].sort((a, b) => a - b);
      const currentDay = d.getUTCDay();
      const nextDay = sorted.find((day) => day > currentDay);
      if (nextDay !== undefined) {
        d.setUTCDate(d.getUTCDate() + (nextDay - currentDay));
      } else {
        const daysToNextWeek = 7 - currentDay + sorted[0] + (interval - 1) * 7;
        d.setUTCDate(d.getUTCDate() + daysToNextWeek);
      }
    } else {
      d.setUTCDate(d.getUTCDate() + 7 * interval);
    }
  } else if (period === RecurringTransactionPeriodEnum.Monthly) {
    if (monthEnd) {
      d.setUTCMonth(d.getUTCMonth() + interval + 1, 0);
    } else {
      const day = d.getUTCDate();
      d.setUTCMonth(d.getUTCMonth() + interval);
      const maxDay = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
      ).getUTCDate();
      if (day > maxDay) d.setUTCDate(maxDay);
    }
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + interval);
  }

  return d.toISOString().split("T")[0];
}

async function materializeTransfer(
  item: {
    user_id: string;
    wallet_id: number | null;
    to_wallet_id: number | null;
    asset_id: number | null;
    from_asset_id: number | null;
    amount: number;
    next_date: string;
    name: string;
    description: string | null;
  },
  db: DrizzleDb,
): Promise<void> {
  const desc = item.description ?? item.name;

  if (item.wallet_id !== null && item.to_wallet_id !== null) {
    // Wallet → Wallet
    await db.insert(transferLogs).values({
      user_id: item.user_id,
      from_wallet_id: item.wallet_id,
      to_wallet_id: item.to_wallet_id,
      date: item.next_date,
      amount: item.amount,
      currency: "INR",
      description: desc,
    });
  } else if (item.wallet_id !== null && item.asset_id !== null) {
    // Wallet → Investment Asset
    const expCats = await MoneyCategoryDAL.findByType(item.user_id, MoneyCategoryTypeEnum.Expense, db);
    const cat = expCats[0];
    if (cat) {
      await ExpenseDAL.insertOne(
        {
          userId: item.user_id,
          date: item.next_date,
          amount: item.amount,
          currency: "INR",
          categoryId: cat.id,
          description: desc,
          walletId: item.wallet_id,
        },
        db,
      );
    }
    await db.insert(investmentCashFlows).values({
      asset_id: item.asset_id,
      amount: item.amount,
      date: item.next_date,
      wallet_id: item.wallet_id,
      description: desc,
    });
  } else if (item.from_asset_id !== null && item.wallet_id !== null) {
    // Investment Asset → Wallet
    const asset = await InvestmentDAL.findAssetWithLatestSnapshot(item.from_asset_id, db);
    if (!asset || asset.current_value === null || asset.current_value <= 0) {
      Logger.error({
        correlationId: "cron",
        logCategory: AppConstants.LOG_CATEGORIES.CRON,
        logAction: "RecurringTransferSkipped",
        message: "Asset has no current value; skipping transfer",
        metadata: { assetId: item.from_asset_id },
      });
      return;
    }

    const transferAmount = Math.min(item.amount, asset.current_value);
    const ratio = asset.invested_amount / asset.current_value;
    const principalReduction = transferAmount * ratio;

    await db.insert(investmentCashFlows).values({
      asset_id: item.from_asset_id,
      amount: -principalReduction,
      date: item.next_date,
      wallet_id: item.wallet_id,
      description: desc,
    });

    await db.insert(assetValueSnapshots).values({
      asset_id: item.from_asset_id,
      value: asset.current_value - transferAmount,
      snapshot_date: item.next_date,
    });

    const incomeCategories = await MoneyCategoryDAL.findByType(item.user_id, MoneyCategoryTypeEnum.Income, db);
    const incomeCat = incomeCategories.find((c) => c.name === "opening_balance") ?? incomeCategories[0];
    if (!incomeCat) {
      Logger.error({
        correlationId: "cron",
        logCategory: AppConstants.LOG_CATEGORIES.CRON,
        logAction: "RecurringTransferSkipped",
        message: "No income category found for wallet credit",
        metadata: { userId: item.user_id },
      });
      return;
    }
    await DepositDAL.insert(
      {
        userId: item.user_id,
        walletId: item.wallet_id,
        date: item.next_date,
        amount: transferAmount,
        currency: "INR",
        categoryId: incomeCat.id,
        description: desc,
      },
      db,
    );
  }
}

export async function processRecurringTransactions(
  db: DrizzleDb,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const due = await RecurringTransactionDAL.findDue(today, db);

  Logger.info({
    correlationId: "cron",
    logCategory: AppConstants.LOG_CATEGORIES.CRON,
    logAction: "ProcessRecurringTransactions",
    message: `Found ${due.length} due recurring transactions`,
    metadata: { today },
  });

  for (const item of due) {
    const endCondition = item.end_condition as RecurringEndConditionEnum;
    const period = item.period as RecurringTransactionPeriodEnum;
    const weekDays: number[] | null = item.week_days
      ? JSON.parse(item.week_days)
      : null;
    const monthEnd = item.month_end === 1;

    // Skip if this item is past its end_date (shouldn't normally happen, but guard anyway)
    if (
      endCondition === RecurringEndConditionEnum.Until &&
      item.end_date &&
      item.next_date > item.end_date
    ) {
      await RecurringTransactionDAL.delete(item.id, db);
      continue;
    }

    // Materialize the transaction
    if (item.type === "expense") {
      await ExpenseDAL.insertOne(
        {
          userId: item.user_id,
          date: item.next_date,
          amount: item.amount,
          currency: "INR",
          categoryId: item.category_id!,
          description: item.description ?? item.name,
          walletId: item.wallet_id!,
        },
        db,
      );
    } else if (item.type === "income") {
      await DepositDAL.insert(
        {
          userId: item.user_id,
          walletId: item.wallet_id!,
          date: item.next_date,
          amount: item.amount,
          currency: "INR",
          categoryId: item.category_id!,
          description: item.description ?? item.name,
        },
        db,
      );
    } else if (item.type === "transfer") {
      await materializeTransfer(item, db);
    }

    // Advance or terminate
    if (endCondition === RecurringEndConditionEnum.For) {
      const remaining = (item.occurrences ?? 1) - 1;
      if (remaining <= 0) {
        await RecurringTransactionDAL.delete(item.id, db);
        continue;
      }
      const nextDate = advanceDate(
        item.next_date,
        period,
        item.interval,
        weekDays,
        monthEnd,
      );
      await db
        .update(recurringTransactionItems)
        .set({ next_date: nextDate, occurrences: remaining })
        .where(eq(recurringTransactionItems.id, item.id));
      continue;
    }

    const nextDate = advanceDate(
      item.next_date,
      period,
      item.interval,
      weekDays,
      monthEnd,
    );

    if (
      endCondition === RecurringEndConditionEnum.Until &&
      item.end_date &&
      nextDate > item.end_date
    ) {
      await RecurringTransactionDAL.delete(item.id, db);
    } else {
      await RecurringTransactionDAL.updateNextDate(item.id, nextDate, db);
    }
  }
}
