export interface InsertExpenseDbRequest {
  userId: string;
  date: string;
  amount: number;
  currency: string;
  categoryId: number;
  description: string | null;
  walletId: number | null;
}

export interface GetExpensesDbRequest {
  userId: string;
  from: string;
  to: string;
  categoryId: number | null;
}

export interface UpdateExpenseDbRequest {
  date?: string;
  amount?: number;
  currency?: string;
  categoryId?: number;
  description?: string | null;
  walletId?: number | null;
}
