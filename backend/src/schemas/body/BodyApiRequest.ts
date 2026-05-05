import { z } from "zod";

// ── Metric CRUD ───────────────────────────────────────────────────────────────

export const ZCreateBodyMetricRequest = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(30),
});
export type CreateBodyMetricRequest = z.infer<typeof ZCreateBodyMetricRequest>;
export type CreateBodyMetricRepoRequest = CreateBodyMetricRequest & { userId: string };

export const ZUpdateBodyMetricRequest = z.object({
  name: z.string().min(1).max(100).optional(),
});
export type UpdateBodyMetricRequest = z.infer<typeof ZUpdateBodyMetricRequest>;
export type UpdateBodyMetricRepoRequest = UpdateBodyMetricRequest & { userId: string; id: number };

// ── Measurement log ───────────────────────────────────────────────────────────

export const ZCreateBodyMeasurementRequest = z.object({
  metric_id: z.number().int().positive(),
  value: z.number(),
  recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type CreateBodyMeasurementRequest = z.infer<typeof ZCreateBodyMeasurementRequest>;
export type CreateBodyMeasurementRepoRequest = CreateBodyMeasurementRequest & { userId: string };

// ── Query ─────────────────────────────────────────────────────────────────────

export const ZGetBodyMeasurementsRequest = z.object({
  metric_id: z.number().int().positive(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type GetBodyMeasurementsRequest = z.infer<typeof ZGetBodyMeasurementsRequest>;
export type GetBodyMeasurementsRepoRequest = GetBodyMeasurementsRequest & { userId: string };
