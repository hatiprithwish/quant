export interface InsertDepositDbRequest {
  userId: string;
  walletId: number;
  date: string;
  amount: number;
  currency: string;
  categoryId: number;
  description: string | null;
}

export interface UpdateDepositDbRequest {
  walletId?: number;
  date?: string;
  amount?: number;
  currency?: string;
  categoryId?: number;
  description?: string | null;
}
