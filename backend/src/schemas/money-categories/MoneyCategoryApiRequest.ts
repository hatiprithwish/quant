import { z } from "zod";
import { MoneyCategoryTypeEnum } from "./MoneyCategoryEnum";

export const ZCreateMoneyCategoryRequest = z.object({
  name: z.string().min(1).max(50),
  display_label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  type: z.nativeEnum(MoneyCategoryTypeEnum),
});
export type CreateMoneyCategoryRequest = z.infer<typeof ZCreateMoneyCategoryRequest>;
export type CreateMoneyCategoryRepoRequest = CreateMoneyCategoryRequest & { userId: string };

export const ZUpdateMoneyCategoryRequest = z.object({
  display_label: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
export type UpdateMoneyCategoryRequest = z.infer<typeof ZUpdateMoneyCategoryRequest>;
export type UpdateMoneyCategoryRepoRequest = UpdateMoneyCategoryRequest & { userId: string; id: number };
