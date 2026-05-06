export interface InsertBodyMetricDbRequest {
  userId: string;
  name: string;
  unit: string;
}

export interface InsertBodyMeasurementLogDbRequest {
  userId: string;
  metricId: number;
  value: number;
  recordedAt: string;
}

export interface GetBodyMeasurementsDbRequest {
  userId: string;
  metricId: number;
  from: string;
  to: string;
}
