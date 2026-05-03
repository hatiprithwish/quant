import { z } from "zod";

export enum DebtTypeEnum {
  Lent = "lent",
  Borrowed = "borrowed",
}
export const ZDebtTypeEnum = z.nativeEnum(DebtTypeEnum);

export enum DebtStatusEnum {
  Pending = "pending",
  InMotion = "in_motion",
  Settled = "settled",
}
export const ZDebtStatusEnum = z.nativeEnum(DebtStatusEnum);
