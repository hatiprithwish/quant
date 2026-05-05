import { z } from "zod";

export enum WalletTypeEnum {
  Bank = "bank",
  Cash = "cash",
  Credit = "credit",
}
export const ZWalletTypeEnum = z.nativeEnum(WalletTypeEnum);

export enum DepositCategoryEnum {
  Salary = "salary",
  Transfer = "transfer",
  Refund = "refund",
  Freelance = "freelance",
  Gift = "gift",
  OpeningBalance = "opening_balance",
  Other = "other",
}
export const ZDepositCategoryEnum = z.nativeEnum(DepositCategoryEnum);
