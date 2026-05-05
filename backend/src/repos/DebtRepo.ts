import { DrizzleDb } from "../db";
import { DebtDAL } from "../data-access-layer/DebtDAL";
import {
  DebtQueryRepoRequest,
  GetDebtsResponse,
  DebtEntry,
  DebtTypeEnum,
} from "../schemas";

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

    const toEntry = (d: (typeof debtRows)[number]): DebtEntry => ({
      id: d.id,
      type: d.type,
      counterparty_name: d.counterparty_name,
      amount: d.amount,
      paid_amount: d.paid_amount,
      status: d.status,
      due_date: d.due_date,
      repayments: (repaymentMap.get(d.id) ?? []).map((r) => ({
        id: r.id,
        amount: r.amount,
        date: r.date,
        note: r.note,
      })),
    });

    return {
      isSuccess: true,
      message: "Debts retrieved",
      lent: debtRows.filter((d) => d.type === DebtTypeEnum.Lent).map(toEntry),
      borrowed: debtRows.filter((d) => d.type === DebtTypeEnum.Borrowed).map(toEntry),
    };
  }
}
