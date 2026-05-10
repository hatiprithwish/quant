import { DebtTypeEnum } from "./DebtEnum";

export interface GetDebtsDbRequest {
  userId: string;
}

export interface GetDebtRepaymentsDbRequest {
  debtIds: number[];
}

export interface CreateDebtDbRequest {
  userId: string;
  type: DebtTypeEnum;
  counterparty_name: string;
  amount: number;
  date: string;
  color: string;
  description?: string;
  wallet_id: number;
}

export interface UpdateDebtDbRequest {
  id: number;
  userId: string;
  counterparty_name?: string;
  amount?: number;
  date?: string;
  color?: string;
  description?: string | null;
}

export interface AddRepaymentDbRequest {
  debtId: number;
  userId: string;
  amount: number;
  date: string;
  note?: string;
  wallet_id: number;
}
