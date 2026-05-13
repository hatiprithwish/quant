import { ApiResponse } from "../common";
import { MoneyCategoryItem } from "../money-categories";

export type TransactionType = "expense" | "income" | "transfer" | "lent" | "borrowed" | "lent_repayment" | "borrowed_repayment" | "investment";

export interface UnifiedTransaction {
  id: number;
  type: TransactionType;
  date: string;
  amount: number;
  currency: string;
  description: string | null;
  category: MoneyCategoryItem | null;
  wallet_id: number | null;
  wallet_name: string | null;
  from_wallet_id: number | null;
  from_wallet_name: string | null;
  to_wallet_id: number | null;
  to_wallet_name: string | null;
}

export interface TransactionDaySummary {
  date: string;
  items: UnifiedTransaction[];
}

export interface GetTransactionsResponse extends ApiResponse {
  byDay: TransactionDaySummary[];
}
