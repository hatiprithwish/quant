import { ApiResponse } from "../common";

export enum MoneyCategoryTypeEnum {
  Expense = "expense",
  Income = "income",
}

export interface MoneyCategoryItem {
  id: number;
  name: string;
  display_label: string;
  color: string;
  type: MoneyCategoryTypeEnum;
}

export interface GetMoneyCategoriesResponse extends ApiResponse {
  categories: MoneyCategoryItem[];
}
