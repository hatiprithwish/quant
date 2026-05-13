export interface CreateInvestmentAccountDbRequest {
  userId: string;
  name: string;
}

export interface UpdateInvestmentAccountDbRequest {
  id: number;
  userId: string;
  name?: string;
}

export interface CreateInvestmentAssetDbRequest {
  accountId: number;
  name: string;
}

export interface UpdateInvestmentAssetDbRequest {
  id: number;
  name?: string;
}

export interface AddCashFlowDbRequest {
  assetId: number;
  amount: number;
  date: string;
  walletId?: number;
  description?: string;
}

export interface AddValueSnapshotDbRequest {
  assetId: number;
  value: number;
  snapshotDate: string;
}
