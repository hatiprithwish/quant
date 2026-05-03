import { ApiResponse } from "../common";
import { DepositCategoryEnum } from "../wallets/WalletEnum";

export interface DepositEntry {
  id: number;
  wallet_id: number;
  date: string;
  amount: number;
  currency: string;
  category: DepositCategoryEnum;
  description: string | null;
}

export interface CreateDepositResponse extends ApiResponse {
  deposit: DepositEntry;
}

export interface UpdateDepositResponse extends ApiResponse {
  deposit: DepositEntry;
}
