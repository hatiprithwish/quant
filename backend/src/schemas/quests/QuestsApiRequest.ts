import { z } from "zod";
import { ZQuestStatusEnum, ZQuestCategoryEnum, ZTaskStatusEnum, ZMilestoneStatusEnum } from "./QuestsEnum";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const ZCreateQuestRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: ZQuestCategoryEnum,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  deadline: z.string().regex(DATE_REGEX).optional(),
});
export type CreateQuestRequest = z.infer<typeof ZCreateQuestRequest>;
export type CreateQuestRepoRequest = CreateQuestRequest & { userId: string };

export const ZUpdateQuestRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  category: ZQuestCategoryEnum.optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: ZQuestStatusEnum.optional(),
  deadline: z.string().regex(DATE_REGEX).nullable().optional(),
});
export type UpdateQuestRequest = z.infer<typeof ZUpdateQuestRequest>;
export type UpdateQuestRepoRequest = UpdateQuestRequest & { questId: string; userId: string };

export const ZGetQuestsDashboardRequest = z.object({
  from: z.string().regex(DATE_REGEX),
  to: z.string().regex(DATE_REGEX),
});
export type GetQuestsDashboardRequest = z.infer<typeof ZGetQuestsDashboardRequest>;
export type GetQuestsDashboardRepoRequest = GetQuestsDashboardRequest & { userId: string };

export const ZCreateMilestoneRequest = z.object({
  name: z.string().min(1).max(200),
  xp_reward: z.number().int().min(0).max(10000).default(100),
  due_date: z.string().regex(DATE_REGEX).optional(),
  order: z.number().int().min(0).optional(),
});
export type CreateMilestoneRequest = z.infer<typeof ZCreateMilestoneRequest>;
export type CreateMilestoneRepoRequest = CreateMilestoneRequest & { questId: string; userId: string };

export const ZUpdateMilestoneRequest = z.object({
  name: z.string().min(1).max(200).optional(),
  xp_reward: z.number().int().min(0).max(10000).optional(),
  due_date: z.string().regex(DATE_REGEX).nullable().optional(),
  status: ZMilestoneStatusEnum.optional(),
  order: z.number().int().min(0).optional(),
});
export type UpdateMilestoneRequest = z.infer<typeof ZUpdateMilestoneRequest>;
export type UpdateMilestoneRepoRequest = UpdateMilestoneRequest & { milestoneId: number; userId: string };

export const ZCreateTaskRequest = z.object({
  milestone_id: z.number().int().optional(),
  name: z.string().min(1).max(200),
  xp_reward: z.number().int().min(0).max(1000).default(20),
  due_date: z.string().regex(DATE_REGEX).optional(),
});
export type CreateTaskRequest = z.infer<typeof ZCreateTaskRequest>;
export type CreateTaskRepoRequest = CreateTaskRequest & { questId: string; userId: string };

export const ZUpdateTaskStatusRequest = z.object({
  status: ZTaskStatusEnum,
});
export type UpdateTaskStatusRequest = z.infer<typeof ZUpdateTaskStatusRequest>;
export type UpdateTaskStatusRepoRequest = UpdateTaskStatusRequest & { taskId: number; userId: string };
