export interface InsertTransferDbRequest {
  userId: string;
  fromWalletId: number;
  toWalletId: number;
  amount: number;
  currency: string;
  description: string | null;
  date: string;
}

export interface UpdateTransferDbRequest {
  fromWalletId?: number;
  toWalletId?: number;
  amount?: number;
  currency?: string;
  description?: string | null;
  date?: string;
}
