import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DrizzleDb } from "../db";
import { TimeRepo } from "../repos/TimeRepo";
import { ZTimeBucketLabelEnum } from "../schemas";
import { AppConstants } from "../config/Constants";

const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export function registerTimeTools(
  server: McpServer,
  userId: string,
  db: DrizzleDb,
) {
  server.tool(
    "log_time",
    "Log a time block for an activity. Use full ISO datetimes so cross-midnight activities (like sleep) are handled correctly.",
    {
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Log date YYYY-MM-DD (the day you are logging for)"),
      bucket: ZTimeBucketLabelEnum.describe(
        `Time bucket. Valid values: ${AppConstants.BUCKETS.join(", ")}`,
      ),
      activity: z
        .string()
        .min(1)
        .describe("Brief description of what was done"),
      start_time: z
        .string()
        .regex(ISO_DATETIME_REGEX)
        .describe("Start datetime as 'YYYY-MM-DD HH:MM' (24h)"),
      end_time: z
        .string()
        .regex(ISO_DATETIME_REGEX)
        .describe(
          "End datetime as 'YYYY-MM-DD HH:MM' (24h). Can be next day for cross-midnight activities.",
        ),
    },
    async ({ date, bucket, activity, start_time, end_time }) => {
      await TimeRepo.logTime(
        { date, bucket, activity, start_time, end_time, userId },
        db,
      );
      const durationMins = Math.round(
        (new Date(end_time).getTime() - new Date(start_time).getTime()) / 60000,
      );
      return {
        content: [
          {
            type: "text",
            text: `Logged ${durationMins} min of "${activity}" (${bucket}) on ${date}.`,
          },
        ],
      };
    },
  );

  server.tool(
    "get_time_summary",
    "Get time tracking summary for a date range, broken down by bucket.",
    {
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Start date YYYY-MM-DD (inclusive)"),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("End date YYYY-MM-DD (inclusive)"),
      bucket: ZTimeBucketLabelEnum.optional().describe(
        "Optional: filter by a specific bucket",
      ),
    },
    async ({ start_date, end_date, bucket }) => {
      const result = await TimeRepo.getSummary(
        { from: start_date, to: end_date, bucket, userId },
        db,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "list_buckets",
    "List all valid time bucket names.",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: AppConstants.BUCKETS.join(", "),
        },
      ],
    }),
  );
}
