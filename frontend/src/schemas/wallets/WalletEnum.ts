export enum WalletTypeEnum {
  Bank = "bank",
  Cash = "cash",
  Credit = "credit",
}

export enum DepositCategoryEnum {
  Salary = "salary",
  Transfer = "transfer",
  Refund = "refund",
  Freelance = "freelance",
  Gift = "gift",
  OpeningBalance = "opening_balance",
  Other = "other",
}

export const depositCategoryDisplayLabel: Record<DepositCategoryEnum, string> = {
  [DepositCategoryEnum.Salary]: "Salary",
  [DepositCategoryEnum.Transfer]: "Transfer",
  [DepositCategoryEnum.Refund]: "Refund",
  [DepositCategoryEnum.Freelance]: "Freelance",
  [DepositCategoryEnum.Gift]: "Gift",
  [DepositCategoryEnum.OpeningBalance]: "Opening Balance",
  [DepositCategoryEnum.Other]: "Other",
};
