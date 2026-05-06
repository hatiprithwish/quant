import { z } from "zod";

export const ZCreateTimeBucketRequest = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  is_distraction: z.boolean().default(false),
  quest_id: z.string().optional().nullable(),
});
export type CreateTimeBucketRequest = z.infer<typeof ZCreateTimeBucketRequest>;
export type CreateTimeBucketRepoRequest = CreateTimeBucketRequest & { userId: string };

export const ZUpdateTimeBucketRequest = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  is_distraction: z.boolean().optional(),
  quest_id: z.string().nullable().optional(),
});
export type UpdateTimeBucketRequest = z.infer<typeof ZUpdateTimeBucketRequest>;
export type UpdateTimeBucketRepoRequest = UpdateTimeBucketRequest & { bucketId: number; userId: string };

// Updated time entry request uses bucket_id instead of bucket label
export const ZLogTimeWithBucketRequest = z.object({
  entries: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    bucket_id: z.number().int().positive(),
    activity: z.string().min(1),
    start_time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/),
  })).min(1),
});
export type LogTimeWithBucketRequest = z.infer<typeof ZLogTimeWithBucketRequest>;
export type LogTimeWithBucketRepoRequest = LogTimeWithBucketRequest & { userId: string };
