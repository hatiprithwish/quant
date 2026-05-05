import { DrizzleDb } from "../db";
import { BodyMeasurementDAL } from "../data-access-layer/BodyMeasurementDAL";
import {
  CreateBodyMetricRepoRequest,
  UpdateBodyMetricRepoRequest,
  CreateBodyMeasurementRepoRequest,
  GetBodyMeasurementsRepoRequest,
  GetBodyMetricsResponse,
  CreateBodyMetricResponse,
  UpdateBodyMetricResponse,
  DeleteBodyMetricResponse,
  GetBodyMeasurementsResponse,
  CreateBodyMeasurementResponse,
  BodyMetricItem,
  DailyBodyMeasurement,
} from "../schemas";

function toMetricItem(row: { id: number; name: string; unit: string; locked: number }): BodyMetricItem {
  return { id: row.id, name: row.name, unit: row.unit, locked: row.locked === 1 };
}

export class BodyMeasurementRepo {
  static async getMetrics(userId: string, db: DrizzleDb): Promise<GetBodyMetricsResponse> {
    const rows = await BodyMeasurementDAL.findMetricsByUser(userId, db);
    return {
      isSuccess: true,
      message: "Metrics retrieved",
      metrics: rows.map(toMetricItem),
    };
  }

  static async createMetric(req: CreateBodyMetricRepoRequest, db: DrizzleDb): Promise<CreateBodyMetricResponse> {
    const row = await BodyMeasurementDAL.insertMetric(
      { userId: req.userId, name: req.name, unit: req.unit },
      db,
    );
    return {
      isSuccess: true,
      message: "Metric created",
      metric: toMetricItem(row),
    };
  }

  static async updateMetric(req: UpdateBodyMetricRepoRequest, db: DrizzleDb): Promise<UpdateBodyMetricResponse> {
    const metric = await BodyMeasurementDAL.findMetricById(req.id, req.userId, db);
    if (!metric) return { isSuccess: false, message: "Metric not found" };
    if (req.name) {
      await BodyMeasurementDAL.updateMetricName(req.id, req.userId, req.name, db);
    }
    return { isSuccess: true, message: "Metric updated" };
  }

  static async deleteMetric(id: number, userId: string, db: DrizzleDb): Promise<DeleteBodyMetricResponse> {
    const metric = await BodyMeasurementDAL.findMetricById(id, userId, db);
    if (!metric) return { isSuccess: false, message: "Metric not found" };
    await BodyMeasurementDAL.softDeleteMetric(id, userId, db);
    return { isSuccess: true, message: "Metric deleted" };
  }

  static async getMeasurements(req: GetBodyMeasurementsRepoRequest, db: DrizzleDb): Promise<GetBodyMeasurementsResponse> {
    const metric = await BodyMeasurementDAL.findMetricById(req.metric_id, req.userId, db);
    if (!metric) return { isSuccess: false, message: "Metric not found", metric: null as unknown as BodyMetricItem, measurements: [] };

    const rows = await BodyMeasurementDAL.findLogsByMetricAndDateRange(
      { userId: req.userId, metricId: req.metric_id, from: req.from, to: req.to },
      db,
    );

    // Group by date, average values per day
    const dayMap = new Map<string, number[]>();
    for (const row of rows) {
      const existing = dayMap.get(row.recorded_at) ?? [];
      existing.push(row.value);
      dayMap.set(row.recorded_at, existing);
    }

    const measurements: DailyBodyMeasurement[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        avg_value: values.reduce((s, v) => s + v, 0) / values.length,
      }));

    return {
      isSuccess: true,
      message: "Measurements retrieved",
      metric: toMetricItem(metric),
      measurements,
    };
  }

  static async createMeasurement(req: CreateBodyMeasurementRepoRequest, db: DrizzleDb): Promise<CreateBodyMeasurementResponse> {
    const metric = await BodyMeasurementDAL.findMetricById(req.metric_id, req.userId, db);
    if (!metric) return { isSuccess: false, message: "Metric not found", id: 0 };

    const row = await BodyMeasurementDAL.insertLog(
      { userId: req.userId, metricId: req.metric_id, value: req.value, recordedAt: req.recorded_at },
      db,
    );

    // Lock metric unit after first log entry
    if (!metric.locked) {
      await BodyMeasurementDAL.lockMetric(metric.id, db);
    }

    return { isSuccess: true, message: "Measurement logged", id: row.id };
  }
}
