import { MoneyCategoryTypeEnum } from "./MoneyCategoryEnum";

export interface InsertMoneyCategoryDbRequest {
  userId: string;
  name: string;
  display_label: string;
  color: string;
  type: MoneyCategoryTypeEnum;
}

export interface UpdateMoneyCategoryDbRequest {
  display_label?: string;
  color?: string;
}
