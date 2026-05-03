import { ApiResponse } from "../common";
import { DebtTypeEnum, DebtStatusEnum } from "./DebtEnum";

export interface DebtRepaymentEntry {
  id: number;
  amount: number;
  date: string;
  note: string | null;
}

export interface DebtEntry {
  id: number;
  type: DebtTypeEnum;
  counterparty_name: string;
  amount: number;
  paid_amount: number;
  status: DebtStatusEnum;
  due_date: string | null;
  repayments: DebtRepaymentEntry[];
}

export interface GetDebtsResponse extends ApiResponse {
  lent: DebtEntry[];
  borrowed: DebtEntry[];
}
