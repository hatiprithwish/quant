import { ApiResponse } from "../common";

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
