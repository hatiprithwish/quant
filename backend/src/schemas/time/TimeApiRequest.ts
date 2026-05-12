import { z } from "zod";

const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export const ZTimeEntryInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bucket_id: z.number().int().positive(),
  activity: z.string().min(1),
  start_time: z
    .string()
    .regex(ISO_DATETIME_REGEX, "Must be YYYY-MM-DD HH:MM"),
  end_time: z
    .string()
    .regex(ISO_DATETIME_REGEX, "Must be YYYY-MM-DD HH:MM"),
});

export const ZLogTimeRequest = z.object({
  entries: z.array(ZTimeEntryInput).min(1),
});
export type LogTimeRequest = z.infer<typeof ZLogTimeRequest>;

export type LogTimeRepoRequest = LogTimeRequest & { userId: string };

export const ZTimeQueryRequest = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bucket_id: z.number().int().positive().optional(),
});
export type TimeQueryRequest = z.infer<typeof ZTimeQueryRequest>;

export type TimeQueryRepoRequest = TimeQueryRequest & { userId: string };

// ── Single time-entry CRUD (new endpoints) ───────────────────────────────────

// Frontend sends ISO 8601: YYYY-MM-DDTHH:MM:SS
const ISO_T_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

export const ZCreateTimeEntryRequest = z.object({
  bucket_id: z.number().int().positive(),
  activity: z.string().min(1).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(ISO_T_REGEX, "Must be YYYY-MM-DDTHH:MM:SS"),
  end_time: z.string().regex(ISO_T_REGEX, "Must be YYYY-MM-DDTHH:MM:SS"),
});
export type CreateTimeEntryRequest = z.infer<typeof ZCreateTimeEntryRequest>;
export type CreateTimeEntryRepoRequest = CreateTimeEntryRequest & { userId: string };

export const ZUpdateTimeEntryRequest = z.object({
  bucket_id: z.number().int().positive().optional(),
  activity: z.string().min(1).max(500).optional(),
  start_time: z.string().regex(ISO_T_REGEX, "Must be YYYY-MM-DDTHH:MM:SS").optional(),
  end_time: z.string().regex(ISO_T_REGEX, "Must be YYYY-MM-DDTHH:MM:SS").optional(),
});
export type UpdateTimeEntryRequest = z.infer<typeof ZUpdateTimeEntryRequest>;
export type UpdateTimeEntryRepoRequest = UpdateTimeEntryRequest & { id: number; userId: string };
