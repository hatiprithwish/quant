import { ApiResponse } from "../common";

export interface CashFlowEntry {
  id: number;
  amount: number;
  date: string;
  wallet_id: number | null;
  wallet_name: string | null;
  description: string | null;
}

export interface ValueSnapshotEntry {
  id: number;
  value: number;
  snapshot_date: string;
}

export interface AssetEntry {
  id: number;
  name: string;
  current_value: number | null;
  last_snapshot_date: string | null;
  invested_amount: number;
  xirr: number | null;
  cash_flows: CashFlowEntry[];
  snapshots: ValueSnapshotEntry[];
}

export interface AccountEntry {
  id: number;
  name: string;
  current_value: number;
  invested_amount: number;
  xirr: number | null;
  assets: AssetEntry[];
}

export interface PortfolioSummary {
  total_current_value: number;
  total_invested: number;
  xirr: number | null;
}

export interface GetInvestmentsResponse extends ApiResponse {
  summary: PortfolioSummary;
  accounts: AccountEntry[];
}

export interface CreateInvestmentAccountResponse extends ApiResponse {
  account: Omit<AccountEntry, "assets">;
}

export interface UpdateInvestmentAccountResponse extends ApiResponse {
  account: Omit<AccountEntry, "assets">;
}

export interface DeleteInvestmentAccountResponse extends ApiResponse {}

export interface CreateInvestmentAssetResponse extends ApiResponse {
  asset: AssetEntry;
}

export interface UpdateInvestmentAssetResponse extends ApiResponse {
  asset: AssetEntry;
}

export interface DeleteInvestmentAssetResponse extends ApiResponse {}

export interface AddCashFlowResponse extends ApiResponse {
  cash_flow: CashFlowEntry;
}

export interface DeleteCashFlowResponse extends ApiResponse {}

export interface UpdateAssetValueResponse extends ApiResponse {
  snapshot: ValueSnapshotEntry;
}
