import { ApiResponse } from "../common";

export interface TransferEntry {
  id: number;
  from_wallet_id: number;
  to_wallet_id: number;
  amount: number;
  currency: string;
  description: string | null;
  date: string;
}

export interface CreateTransferResponse extends ApiResponse {
  transfer: TransferEntry;
}

export interface UpdateTransferResponse extends ApiResponse {
  transfer: TransferEntry;
}
