import { DrizzleDb } from "../db";
import { DebtDAL } from "../data-access-layer/DebtDAL";
import {
  DebtQueryRepoRequest,
  GetDebtsResponse,
  CreateDebtResponse,
  UpdateDebtResponse,
  AddRepaymentResponse,
  DebtEntry,
  DebtTypeEnum,
  CreateDebtRequest,
  UpdateDebtRequest,
  AddRepaymentRequest,
} from "../schemas";

function toEntry(
  d: { id: number; type: string; counterparty_name: string; amount: number; paid_amount: number; status: string; date: string; color: string; description: string | null; wallet_id: number | null },
  repayments: { id: number; amount: number; date: string; note: string | null }[],
): DebtEntry {
  return {
    id: d.id,
    type: d.type as DebtTypeEnum,
    counterparty_name: d.counterparty_name,
    amount: d.amount,
    paid_amount: d.paid_amount,
    status: d.status as DebtEntry["status"],
    date: d.date,
    color: d.color,
    description: d.description,
    wallet_id: d.wallet_id,
    repayments: repayments.map((r) => ({ id: r.id, amount: r.amount, date: r.date, note: r.note })),
  };
}

export class DebtRepo {
  static async getDebts(
    req: DebtQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetDebtsResponse> {
    const debtRows = await DebtDAL.findAll({ userId: req.userId }, db);
    const debtIds = debtRows.map((d) => d.id);
    const repaymentRows = await DebtDAL.findRepaymentsByDebtIds({ debtIds }, db);

    const repaymentMap = new Map<number, typeof repaymentRows>();
    for (const r of repaymentRows) {
      if (!repaymentMap.has(r.debt_id)) repaymentMap.set(r.debt_id, []);
      repaymentMap.get(r.debt_id)!.push(r);
    }

    return {
      isSuccess: true,
      message: "Debts retrieved",
      lent: debtRows.filter((d) => d.type === DebtTypeEnum.Lent).map((d) => toEntry(d, repaymentMap.get(d.id) ?? [])),
      borrowed: debtRows.filter((d) => d.type === DebtTypeEnum.Borrowed).map((d) => toEntry(d, repaymentMap.get(d.id) ?? [])),
    };
  }

  static async createDebt(
    userId: string,
    req: CreateDebtRequest,
    db: DrizzleDb,
  ): Promise<CreateDebtResponse> {
    const debt = await DebtDAL.create({ userId, ...req }, db);
    return {
      isSuccess: true,
      message: "Debt created",
      debt: toEntry(debt, []),
    };
  }

  static async updateDebt(
    userId: string,
    id: number,
    req: UpdateDebtRequest,
    db: DrizzleDb,
  ): Promise<UpdateDebtResponse> {
    const debt = await DebtDAL.update({ id, userId, ...req }, db);
    if (!debt) throw new Error("Debt not found");
    const repayments = await DebtDAL.findRepaymentsByDebtId(id, db);
    return {
      isSuccess: true,
      message: "Debt updated",
      debt: toEntry(debt, repayments),
    };
  }

  static async addRepayment(
    userId: string,
    debtId: number,
    req: AddRepaymentRequest,
    db: DrizzleDb,
  ): Promise<AddRepaymentResponse> {
    const existing = await DebtDAL.findById(debtId, userId, db);
    if (!existing) throw new Error("Debt not found");
    const { debt, repayments } = await DebtDAL.addRepayment({ debtId, userId, ...req }, db);
    return {
      isSuccess: true,
      message: "Repayment added",
      debt: toEntry(debt, repayments),
    };
  }
}
