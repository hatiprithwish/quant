import { z } from "zod";

export enum WalletTypeEnum {
  Bank = "bank",
  Cash = "cash",
  Credit = "credit",
}
export const ZWalletTypeEnum = z.nativeEnum(WalletTypeEnum);

// Income categories are now user-defined and stored in the money_categories table.
