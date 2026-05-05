import { z } from "zod";
import type { ApiResponse } from "@/schemas/common";

// ── Request schemas (form validation + API payload) ───────────────────────────

export const ZCreateBodyMetricRequest = z.object({
  name: z.string().min(1, "Name is required").max(100),
  unit: z.string().min(1, "Unit is required").max(30),
});
export type CreateBodyMetricRequest = z.infer<typeof ZCreateBodyMetricRequest>;

export const ZUpdateBodyMetricRequest = z.object({
  name: z.string().min(1).max(100).optional(),
});
export type UpdateBodyMetricRequest = z.infer<typeof ZUpdateBodyMetricRequest>;

export const ZCreateBodyMeasurementRequest = z.object({
  metric_id: z.number().int().positive(),
  value: z.number(),
  recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type CreateBodyMeasurementRequest = z.infer<typeof ZCreateBodyMeasurementRequest>;

export const ZGetBodyMeasurementsRequest = z.object({
  metric_id: z.number().int().positive(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type GetBodyMeasurementsRequest = z.infer<typeof ZGetBodyMeasurementsRequest>;

// ── Response interfaces ───────────────────────────────────────────────────────

export interface BodyMetricItem {
  id: number;
  name: string;
  unit: string;
  locked: boolean;
}

export interface GetBodyMetricsResponse extends ApiResponse {
  metrics: BodyMetricItem[];
}

export interface CreateBodyMetricResponse extends ApiResponse {
  metric: BodyMetricItem;
}

export interface UpdateBodyMetricResponse extends ApiResponse {}

export interface DeleteBodyMetricResponse extends ApiResponse {}

export interface DailyBodyMeasurement {
  date: string;
  avg_value: number;
}

export interface GetBodyMeasurementsResponse extends ApiResponse {
  metric: BodyMetricItem;
  measurements: DailyBodyMeasurement[];
}

export interface CreateBodyMeasurementResponse extends ApiResponse {
  id: number;
}
