import { z } from "zod";

export const ZSaveDailyLogRequest = z.object({
  content: z.string(),
});
export type SaveDailyLogRequest = z.infer<typeof ZSaveDailyLogRequest>;
export type SaveDailyLogRepoRequest = SaveDailyLogRequest & {
  userId: string;
  date: string;
};

export const ZDateParam = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});
export type DateParam = z.infer<typeof ZDateParam>;

export const ZWeeklyReviewRequest = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type WeeklyReviewRequest = z.infer<typeof ZWeeklyReviewRequest>;
export type WeeklyReviewRepoRequest = WeeklyReviewRequest & { userId: string };

export const ZCompareDaysRequest = z.object({
  date1: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date2: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type CompareDaysRequest = z.infer<typeof ZCompareDaysRequest>;
export type CompareDaysRepoRequest = CompareDaysRequest & { userId: string };
