import { DrizzleDb } from "../db";
import { TimeDAL } from "../data-access-layer/TimeDAL";
import {
  LogTimeRepoRequest,
  TimeQueryRepoRequest,
  timeBucketLabelToInt,
  timeBucketIntToLabel,
  TimeBucketIntEnum,
  LogTimeResponse,
  GetTimeSummaryResponse,
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
        bucket: timeBucketLabelToInt[entry.bucket],
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
    const bucketFilter = req.bucket ? timeBucketLabelToInt[req.bucket] : null;

    const rows = await TimeDAL.findByDateRange(
      { userId: req.userId, from: req.from, to: req.to, bucket: bucketFilter },
      db,
    );

    const dayMap = new Map<string, Map<TimeBucketIntEnum, TimeActivity[]>>();
    const bucketTotals = new Map<TimeBucketIntEnum, number>();
    let totalMinutes = 0;

    for (const row of rows) {
      const duration = computeDurationMinutes(row.start_time, row.end_time);

      if (!dayMap.has(row.date)) dayMap.set(row.date, new Map());
      const bMap = dayMap.get(row.date)!;
      if (!bMap.has(row.bucket)) bMap.set(row.bucket, []);

      bMap.get(row.bucket)!.push({
        id: row.id,
        date: row.date,
        bucket: timeBucketIntToLabel[row.bucket],
        activity: row.activity,
        start_time: row.start_time,
        end_time: row.end_time,
        duration_minutes: duration,
      });

      bucketTotals.set(
        row.bucket,
        (bucketTotals.get(row.bucket) ?? 0) + duration,
      );
      totalMinutes += duration;
    }

    const days: DayTimeSummary[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bMap]) => {
        const buckets: BucketSummary[] = Array.from(bMap.entries()).map(
          ([bucketInt, activities]) => ({
            bucket: timeBucketIntToLabel[bucketInt],
            total_minutes: activities.reduce(
              (s, a) => s + a.duration_minutes,
              0,
            ),
            activities,
          }),
        );
        return {
          date,
          total_minutes: buckets.reduce((s, b) => s + b.total_minutes, 0),
          buckets,
        };
      });

    const byBucket = Array.from(bucketTotals.entries()).map(([b, mins]) => ({
      bucket: timeBucketIntToLabel[b],
      total_minutes: mins,
    }));

    return {
      isSuccess: true,
      message: "Time summary retrieved",
      days,
      totalMinutes,
      byBucket,
    };
  }
}
