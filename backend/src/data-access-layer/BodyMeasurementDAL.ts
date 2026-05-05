import { and, between, eq, isNull } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { bodyMetrics, bodyMeasurementLogs } from "../db/tables";
import {
  InsertBodyMetricDbRequest,
  InsertBodyMeasurementLogDbRequest,
  GetBodyMeasurementsDbRequest,
} from "../schemas";

export class BodyMeasurementDAL {
  // ── Metrics ─────────────────────────────────────────────────────────────────

  static async findMetricsByUser(userId: string, db: DrizzleDb) {
    return db
      .select()
      .from(bodyMetrics)
      .where(and(eq(bodyMetrics.user_id, userId), isNull(bodyMetrics.deleted_at)))
      .orderBy(bodyMetrics.created_at);
  }

  static async findMetricById(id: number, userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(bodyMetrics)
      .where(and(eq(bodyMetrics.id, id), eq(bodyMetrics.user_id, userId), isNull(bodyMetrics.deleted_at)))
      .limit(1);
    return rows[0] ?? null;
  }

  static async insertMetric(req: InsertBodyMetricDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(bodyMetrics)
      .values({ user_id: req.userId, name: req.name, unit: req.unit })
      .returning();
    return rows[0];
  }

  static async updateMetricName(id: number, userId: string, name: string, db: DrizzleDb) {
    return db
      .update(bodyMetrics)
      .set({ name, updated_at: new Date().toISOString().replace("T", " ").slice(0, 19) })
      .where(and(eq(bodyMetrics.id, id), eq(bodyMetrics.user_id, userId), isNull(bodyMetrics.deleted_at)));
  }

  static async lockMetric(id: number, db: DrizzleDb) {
    return db
      .update(bodyMetrics)
      .set({ locked: 1 })
      .where(eq(bodyMetrics.id, id));
  }

  static async softDeleteMetric(id: number, userId: string, db: DrizzleDb) {
    return db
      .update(bodyMetrics)
      .set({ deleted_at: new Date().toISOString().replace("T", " ").slice(0, 19) })
      .where(and(eq(bodyMetrics.id, id), eq(bodyMetrics.user_id, userId)));
  }

  // ── Measurement logs ─────────────────────────────────────────────────────────

  static async insertLog(req: InsertBodyMeasurementLogDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(bodyMeasurementLogs)
      .values({
        user_id: req.userId,
        metric_id: req.metricId,
        value: req.value,
        recorded_at: req.recordedAt,
      })
      .returning();
    return rows[0];
  }

  static async findLogsByMetricAndDateRange(req: GetBodyMeasurementsDbRequest, db: DrizzleDb) {
    return db
      .select()
      .from(bodyMeasurementLogs)
      .where(
        and(
          eq(bodyMeasurementLogs.user_id, req.userId),
          eq(bodyMeasurementLogs.metric_id, req.metricId),
          between(bodyMeasurementLogs.recorded_at, req.from, req.to),
        ),
      )
      .orderBy(bodyMeasurementLogs.recorded_at);
  }

  static async countLogsByMetric(metricId: number, userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(bodyMeasurementLogs)
      .where(and(eq(bodyMeasurementLogs.metric_id, metricId), eq(bodyMeasurementLogs.user_id, userId)))
      .limit(1);
    return rows.length;
  }
}
