import { ApiResponse } from "../common";
import { MoneyCategoryItem } from "../money-categories";

export interface DepositEntry {
  id: number;
  wallet_id: number;
  date: string;
  amount: number;
  currency: string;
  category: MoneyCategoryItem;
  description: string | null;
}

export interface CreateDepositResponse extends ApiResponse {
  deposit: DepositEntry;
}

export interface UpdateDepositResponse extends ApiResponse {
  deposit: DepositEntry;
}
