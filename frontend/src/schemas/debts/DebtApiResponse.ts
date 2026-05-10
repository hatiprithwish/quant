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
  date: string;
  color: string;
  description: string | null;
  wallet_id: number | null;
  repayments: DebtRepaymentEntry[];
}

export interface GetDebtsResponse extends ApiResponse {
  lent: DebtEntry[];
  borrowed: DebtEntry[];
}

export interface CreateDebtResponse extends ApiResponse {
  debt: DebtEntry;
}

export interface UpdateDebtResponse extends ApiResponse {
  debt: DebtEntry;
}

export interface AddRepaymentResponse extends ApiResponse {
  debt: DebtEntry;
}
