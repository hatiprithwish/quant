import { ApiResponse } from "../common";
import { WalletTypeEnum } from "./WalletEnum";

export interface WalletWithBalance {
  id: number;
  name: string;
  type: WalletTypeEnum;
  credit_limit: number | null;
  balance: number;
  active: boolean;
}

export interface GetWalletsResponse extends ApiResponse {
  wallets: WalletWithBalance[];
}

export interface CreateWalletResponse extends ApiResponse {
  wallet: WalletWithBalance;
}

export interface UpdateWalletResponse extends ApiResponse {
  wallet: WalletWithBalance;
}
