import { DrizzleDb } from "../db";
import { TimeDAL } from "../data-access-layer/TimeDAL";
import {
  LogTimeRepoRequest,
  TimeQueryRepoRequest,
  CreateTimeEntryRepoRequest,
  UpdateTimeEntryRepoRequest,
  GetBucketEntriesRepoRequest,
  LogTimeResponse,
  GetTimeSummaryResponse,
  CreateTimeEntryResponse,
  UpdateTimeEntryResponse,
  DeleteTimeEntryResponse,
  GetBucketEntriesResponse,
  DayTimeSummary,
  BucketSummary,
  TimeActivity,
} from "../schemas";

function computeDurationMinutes(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.round((end - start) / 60000);
}

export class TimeRepo {
  static async logTime(
    req: LogTimeRepoRequest,
    db: DrizzleDb,
  ): Promise<LogTimeResponse> {
    await TimeDAL.insertMany(
      req.entries.map((entry) => ({
        userId: req.userId,
        date: entry.date,
        bucket_id: entry.bucket_id,
        activity: entry.activity,
        startTime: entry.start_time,
        endTime: entry.end_time,
      })),
      db,
    );

    return { isSuccess: true, message: "Time logged", insertedCount: req.entries.length };
  }

  static async getSummary(
    req: TimeQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetTimeSummaryResponse> {
    const rows = await TimeDAL.findByDateRange(
      { userId: req.userId, from: req.from, to: req.to, bucket_id: req.bucket_id ?? null },
      db,
    );

    const dayMap = new Map<string, Map<number, TimeActivity[]>>();
    const bucketTotals = new Map<number, { name: string; color: string; minutes: number }>();
    let totalMinutes = 0;

    for (const row of rows) {
      const duration = computeDurationMinutes(row.start_time, row.end_time);

      if (!dayMap.has(row.date)) dayMap.set(row.date, new Map());
      const bMap = dayMap.get(row.date)!;
      if (!bMap.has(row.bucket_id)) bMap.set(row.bucket_id, []);

      bMap.get(row.bucket_id)!.push({
        id: row.id,
        date: row.date,
        bucket_id: row.bucket_id,
        bucket_name: row.bucket_name,
        bucket_color: row.bucket_color,
        activity: row.activity,
        start_time: row.start_time,
        end_time: row.end_time,
        duration_minutes: duration,
      });

      const existing = bucketTotals.get(row.bucket_id);
      bucketTotals.set(row.bucket_id, {
        name: row.bucket_name,
        color: row.bucket_color,
        minutes: (existing?.minutes ?? 0) + duration,
      });
      totalMinutes += duration;
    }

    const days: DayTimeSummary[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bMap]) => {
        const buckets: BucketSummary[] = Array.from(bMap.entries()).map(
          ([bucketId, activities]) => ({
            bucket_id: bucketId,
            bucket_name: activities[0].bucket_name,
            bucket_color: activities[0].bucket_color,
            total_minutes: activities.reduce((s, a) => s + a.duration_minutes, 0),
            activities,
          }),
        );
        return {
          date,
          total_minutes: buckets.reduce((s, b) => s + b.total_minutes, 0),
          buckets,
        };
      });

    const byBucket = Array.from(bucketTotals.entries()).map(([id, { name, color, minutes }]) => ({
      bucket_id: id,
      bucket_name: name,
      bucket_color: color,
      total_minutes: minutes,
    }));

    return {
      isSuccess: true,
      message: "Time summary retrieved",
      days,
      totalMinutes,
      byBucket,
    };
  }

  static async createEntry(
    req: CreateTimeEntryRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateTimeEntryResponse> {
    const rows = await TimeDAL.insertOne(
      {
        user_id: req.userId,
        date: req.date,
        bucket_id: req.bucket_id,
        activity: req.activity,
        start_time: req.start_time,
        end_time: req.end_time,
      },
      db,
    );
    return { isSuccess: true, message: "Entry created", id: rows[0].id };
  }

  static async updateEntry(
    req: UpdateTimeEntryRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateTimeEntryResponse> {
    await TimeDAL.update(
      { id: req.id, userId: req.userId, bucket_id: req.bucket_id, activity: req.activity, start_time: req.start_time, end_time: req.end_time },
      db,
    );
    return { isSuccess: true, message: "Entry updated" };
  }

  static async deleteEntry(
    id: number,
    userId: string,
    db: DrizzleDb,
  ): Promise<DeleteTimeEntryResponse> {
    await TimeDAL.softDelete(id, userId, db);
    return { isSuccess: true, message: "Entry deleted" };
  }

  static async getBucketEntries(
    req: GetBucketEntriesRepoRequest,
    db: DrizzleDb,
  ): Promise<GetBucketEntriesResponse> {
    const { rows, total } = await TimeDAL.findByBucketPaginated(
      {
        userId: req.userId,
        bucket_id: req.bucket_id,
        search: req.search ?? null,
        page: req.page,
        page_size: req.page_size,
      },
      db,
    );

    const entries: TimeActivity[] = rows.map((row) => ({
      id: row.id,
      date: row.date,
      bucket_id: row.bucket_id,
      bucket_name: row.bucket_name,
      bucket_color: row.bucket_color,
      activity: row.activity,
      start_time: row.start_time,
      end_time: row.end_time,
      duration_minutes: computeDurationMinutes(row.start_time, row.end_time),
    }));

    const total_pages = Math.max(1, Math.ceil(total / req.page_size));

    return {
      isSuccess: true,
      message: "Entries retrieved",
      entries,
      total,
      page: req.page,
      page_size: req.page_size,
      total_pages,
    };
  }
}
