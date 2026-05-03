import { DepositCategoryEnum } from "../wallets/WalletEnum";

export interface InsertDepositDbRequest {
  userId: string;
  walletId: number;
  date: string;
  amount: number;
  currency: string;
  category: DepositCategoryEnum;
  description: string | null;
}

export interface UpdateDepositDbRequest {
  walletId?: number;
  date?: string;
  amount?: number;
  currency?: string;
  category?: DepositCategoryEnum;
  description?: string | null;
}
