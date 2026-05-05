export interface GetWalletsDbRequest {
  userId: string;
}

export interface InsertWalletDbRequest {
  userId: string;
  name: string;
  type: string;
  credit_limit: number | null;
}

export interface UpdateWalletDbRequest {
  name?: string;
  type?: string;
  credit_limit?: number | null;
}

