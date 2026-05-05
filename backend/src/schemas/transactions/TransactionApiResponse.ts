import { ApiResponse } from "../common";
import { ExpenseCategoryLabelEnum } from "../expenses/ExpenseEnum";
import { DepositCategoryEnum } from "../wallets/WalletEnum";

export type TransactionType = "expense" | "income" | "transfer";

export interface UnifiedTransaction {
  id: number;
  type: TransactionType;
  date: string;
  amount: number;
  currency: string;
  description: string | null;
  expense_category: ExpenseCategoryLabelEnum | null;
  income_category: DepositCategoryEnum | null;
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
