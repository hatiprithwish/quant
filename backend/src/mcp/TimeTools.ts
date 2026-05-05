import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DrizzleDb } from "../db";
import { TimeRepo } from "../repos/TimeRepo";
import { TimeBucketsRepo } from "../repos/TimeBucketsRepo";

const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export function registerTimeTools(
  server: McpServer,
  userId: string,
  db: DrizzleDb,
) {
  server.tool(
    "log_time",
    "Log one or more time blocks in a single call. Use full ISO datetimes so cross-midnight activities (like sleep) are handled correctly. Use list_buckets to get valid bucket IDs.",
    {
      entries: z
        .array(
          z.object({
            date: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/)
              .describe("Log date YYYY-MM-DD (the day you are logging for)"),
            bucket_id: z
              .number()
              .int()
              .positive()
              .describe("Bucket ID from list_buckets"),
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
          }),
        )
        .min(1)
        .describe("List of time blocks to log"),
    },
    async ({ entries }) => {
      const result = await TimeRepo.logTime({ entries, userId }, db);
      return {
        content: [
          {
            type: "text",
            text: `Logged ${result.insertedCount} time block(s).`,
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
      bucket_id: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Optional: filter by a specific bucket ID"),
    },
    async ({ start_date, end_date, bucket_id }) => {
      const result = await TimeRepo.getSummary(
        { from: start_date, to: end_date, bucket_id, userId },
        db,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "list_buckets",
    "List all time buckets for the current user (id, name, color, is_distraction).",
    {},
    async () => {
      const result = await TimeBucketsRepo.list({ userId }, db);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.buckets, null, 2),
          },
        ],
      };
    },
  );
}
