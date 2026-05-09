import { ApiResponse } from "../common";
import { MoneyCategoryTypeEnum } from "./MoneyCategoryEnum";

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

export interface CreateMoneyCategoryResponse extends ApiResponse {
  category: MoneyCategoryItem;
}

export interface UpdateMoneyCategoryResponse extends ApiResponse {
  category: MoneyCategoryItem;
}

export interface DeleteMoneyCategoryResponse extends ApiResponse {}
