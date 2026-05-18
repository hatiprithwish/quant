import { z } from "zod";
import { ZTrajectoryPhaseEnum, ZGoalChangeTypeEnum, ZEliminationResultEnum, ZTaskPhaseTagEnum } from "./TrajectoryEnum";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ── Trajectory Config ────────────────────────────────────────────────────────

export const ZUpsertTrajectoryConfigRequest = z.object({
  escape_number: z.number().positive().optional(),
  monthly_investment_target: z.number().positive().optional(),
  assumed_annual_return_rate: z.number().min(0).max(1).optional(),
  current_monthly_income: z.number().positive().optional(),
  income_milestone_year1: z.number().positive().optional(),
  income_milestone_year3: z.number().positive().optional(),
});
export type UpsertTrajectoryConfigRequest = z.infer<typeof ZUpsertTrajectoryConfigRequest>;
export type UpsertTrajectoryConfigRepoRequest = UpsertTrajectoryConfigRequest & { userId: string };

// ── Trajectory Quests ────────────────────────────────────────────────────────

export const ZCreateTrajectoryQuestRequest = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  trajectory_phase: ZTrajectoryPhaseEnum,
  parent_quest_id: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#a78bfa"),
  deadline: z.string().regex(DATE_REGEX).optional(),
  escape_number: z.number().positive().optional(),
});
export type CreateTrajectoryQuestRequest = z.infer<typeof ZCreateTrajectoryQuestRequest>;
export type CreateTrajectoryQuestRepoRequest = CreateTrajectoryQuestRequest & { userId: string };

export const ZUpdateTrajectoryQuestRequest = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  deadline: z.string().regex(DATE_REGEX).nullable().optional(),
  escape_number: z.number().positive().nullable().optional(),
  parent_quest_id: z.string().nullable().optional(),
});
export type UpdateTrajectoryQuestRequest = z.infer<typeof ZUpdateTrajectoryQuestRequest>;
export type UpdateTrajectoryQuestRepoRequest = UpdateTrajectoryQuestRequest & { questId: string; userId: string };

// ── Goal Change Requests ─────────────────────────────────────────────────────

export const ZCreateGoalChangeRequest = z.object({
  quest_id: z.string(),
  change_type: ZGoalChangeTypeEnum,
  reason: z.string().min(10).max(1000),
  new_description: z.string().max(1000).optional(),
});
export type CreateGoalChangeRequest = z.infer<typeof ZCreateGoalChangeRequest>;
export type CreateGoalChangeRepoRequest = CreateGoalChangeRequest & { userId: string };

export const ZConfirmGoalChangeRequest = z.object({
  change_request_id: z.number().int(),
});
export type ConfirmGoalChangeRequest = z.infer<typeof ZConfirmGoalChangeRequest>;
export type ConfirmGoalChangeRepoRequest = ConfirmGoalChangeRequest & { userId: string };

// ── Elimination Items ────────────────────────────────────────────────────────

export const ZCreateEliminationItemRequest = z.object({
  week_start: z.string().regex(DATE_REGEX),
  description: z.string().min(1).max(200),
  linked_time_bucket_id: z.number().int().optional(),
  linked_money_category_id: z.number().int().optional(),
  linked_food_type: z.string().optional(),
});
export type CreateEliminationItemRequest = z.infer<typeof ZCreateEliminationItemRequest>;
export type CreateEliminationItemRepoRequest = CreateEliminationItemRequest & { userId: string };

export const ZUpdateEliminationItemRequest = z.object({
  result: ZEliminationResultEnum.optional(),
  notes: z.string().max(500).nullable().optional(),
});
export type UpdateEliminationItemRequest = z.infer<typeof ZUpdateEliminationItemRequest>;
export type UpdateEliminationItemRepoRequest = UpdateEliminationItemRequest & { itemId: number; userId: string };

// ── Weekly Check-In ──────────────────────────────────────────────────────────

export const ZSubmitCheckinCorrectionRequest = z.object({
  week_start: z.string().regex(DATE_REGEX),
  // Keyed by section: 'task_completion' | 'elimination' | 'decision_alignment' | 'confidence' | 'narrative'
  corrections: z.record(z.string(), z.string()),
  // Optional score overrides (for confidence section)
  confidence_override: z.number().min(0).max(100).optional(),
});
export type SubmitCheckinCorrectionRequest = z.infer<typeof ZSubmitCheckinCorrectionRequest>;
export type SubmitCheckinCorrectionRepoRequest = SubmitCheckinCorrectionRequest & { userId: string };

export const ZLockInWeekRequest = z.object({
  week_start: z.string().regex(DATE_REGEX),
});
export type LockInWeekRequest = z.infer<typeof ZLockInWeekRequest>;
export type LockInWeekRepoRequest = LockInWeekRequest & { userId: string };

// ── Task Phase Tag ───────────────────────────────────────────────────────────

export const ZUpdateTaskPhaseTagRequest = z.object({
  phase_tag: ZTaskPhaseTagEnum.nullable(),
});
export type UpdateTaskPhaseTagRequest = z.infer<typeof ZUpdateTaskPhaseTagRequest>;
export type UpdateTaskPhaseTagRepoRequest = UpdateTaskPhaseTagRequest & { taskId: number; userId: string };
