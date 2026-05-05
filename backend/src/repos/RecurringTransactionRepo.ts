import { DrizzleDb } from "../db";
import { RecurringTransactionDAL } from "../data-access-layer/RecurringTransactionDAL";
import {
  RecurringTransactionQueryRepoRequest,
  GetRecurringTransactionsResponse,
  CreateRecurringTransactionRepoRequest,
  CreateRecurringTransactionResponse,
  UpdateRecurringTransactionRepoRequest,
  UpdateRecurringTransactionResponse,
  expenseCategoryIntToLabel,
  expenseCategoryLabelToInt,
  RecurringTransactionPeriodEnum,
  RecurringEndConditionEnum,
  RecurringTransactionTypeEnum,
} from "../schemas";

function calcEndDate(
  startDate: string,
  period: RecurringTransactionPeriodEnum,
  interval: number,
  occurrences: number,
): string {
  const d = new Date(startDate + "T00:00:00");
  for (let i = 0; i < occurrences; i++) {
    if (period === RecurringTransactionPeriodEnum.Weekly) {
      d.setDate(d.getDate() + 7 * interval);
    } else if (period === RecurringTransactionPeriodEnum.Monthly) {
      d.setMonth(d.getMonth() + interval);
    } else {
      d.setFullYear(d.getFullYear() + interval);
    }
  }
  return d.toISOString().split("T")[0];
}

function rowToItem(row: {
  id: number;
  type: string;
  name: string;
  amount: number;
  period: string;
  interval: number;
  week_days: string | null;
  month_end: number;
  end_condition: string;
  end_date: string | null;
  occurrences: number | null;
  category: number;
  description: string | null;
  wallet_id: number;
  next_date: string;
}) {
  return {
    id: row.id,
    type: row.type as RecurringTransactionTypeEnum,
    name: row.name,
    amount: row.amount,
    period: row.period as RecurringTransactionPeriodEnum,
    interval: row.interval,
    week_days: row.week_days ? JSON.parse(row.week_days) as number[] : null,
    month_end: row.month_end === 1,
    end_condition: row.end_condition as RecurringEndConditionEnum,
    end_date: row.end_date,
    occurrences: row.occurrences,
    category: expenseCategoryIntToLabel[row.category as keyof typeof expenseCategoryIntToLabel],
    description: row.description,
    wallet_id: row.wallet_id,
    next_date: row.next_date,
  };
}

export class RecurringTransactionRepo {
  static async getRecurringTransactions(
    req: RecurringTransactionQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetRecurringTransactionsResponse> {
    const rows = await RecurringTransactionDAL.findAll({ userId: req.userId }, db);
    return {
      isSuccess: true,
      message: "Recurring transactions retrieved",
      items: rows.map(rowToItem),
    };
  }

  static async createRecurringTransaction(
    req: CreateRecurringTransactionRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateRecurringTransactionResponse> {
    const categoryInt = expenseCategoryLabelToInt[req.category as keyof typeof expenseCategoryLabelToInt];

    let endDate: string | null = null;
    if (req.end_condition === RecurringEndConditionEnum.Until) {
      endDate = req.end_date ?? null;
    } else if (req.end_condition === RecurringEndConditionEnum.For && req.occurrences) {
      endDate = calcEndDate(req.start_date, req.period, req.interval, req.occurrences);
    }

    const row = await RecurringTransactionDAL.insert(
      {
        userId: req.userId,
        walletId: req.wallet_id,
        type: req.type,
        name: req.name,
        amount: req.amount,
        period: req.period,
        interval: req.interval,
        weekDays: req.week_days ? JSON.stringify(req.week_days) : null,
        monthEnd: req.month_end ? 1 : 0,
        endCondition: req.end_condition,
        endDate,
        occurrences: req.occurrences ?? null,
        category: categoryInt,
        description: req.description ?? null,
        nextDate: req.start_date,
      },
      db,
    );

    return {
      isSuccess: true,
      message: "Recurring transaction created",
      item: rowToItem(row),
    };
  }

  static async updateRecurringTransaction(
    req: UpdateRecurringTransactionRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateRecurringTransactionResponse> {
    const updates: Parameters<typeof RecurringTransactionDAL.update>[0] = {
      id: req.id,
      userId: req.userId,
    };

    if (req.wallet_id !== undefined) updates.walletId = req.wallet_id;
    if (req.type !== undefined) updates.type = req.type;
    if (req.name !== undefined) updates.name = req.name;
    if (req.amount !== undefined) updates.amount = req.amount;
    if (req.period !== undefined) updates.period = req.period;
    if (req.interval !== undefined) updates.interval = req.interval;
    if (req.week_days !== undefined) updates.weekDays = req.week_days ? JSON.stringify(req.week_days) : null;
    if (req.month_end !== undefined) updates.monthEnd = req.month_end ? 1 : 0;
    if (req.description !== undefined) updates.description = req.description ?? null;
    if (req.start_date !== undefined) updates.nextDate = req.start_date;

    if (req.end_condition !== undefined) {
      updates.endCondition = req.end_condition;
      if (req.end_condition === RecurringEndConditionEnum.Forever) {
        updates.endDate = null;
        updates.occurrences = null;
      } else if (req.end_condition === RecurringEndConditionEnum.Until) {
        updates.endDate = req.end_date ?? null;
        updates.occurrences = null;
      } else if (req.end_condition === RecurringEndConditionEnum.For) {
        updates.occurrences = req.occurrences ?? null;
        const startDate = req.start_date ?? null;
        const period = req.period;
        const interval = req.interval ?? 1;
        if (startDate && period && req.occurrences) {
          updates.endDate = calcEndDate(startDate, period, interval, req.occurrences);
        }
      }
    }

    const row = await RecurringTransactionDAL.update(updates, db);
    if (!row) {
      return { isSuccess: false, message: "Recurring transaction not found", item: null as never };
    }

    return {
      isSuccess: true,
      message: "Recurring transaction updated",
      item: rowToItem(row),
    };
  }
}
