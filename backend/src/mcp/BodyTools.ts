import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DrizzleDb } from "../db";
import { BodyMeasurementRepo } from "../repos/BodyMeasurementRepo";

export function registerBodyTools(server: McpServer, userId: string, db: DrizzleDb) {
  server.tool(
    "list_body_metrics",
    "List all body measurement metrics the user has defined (e.g. Weight, Bicep). Always call this before logging a measurement to get valid metric IDs.",
    {},
    async () => {
      const result = await BodyMeasurementRepo.getMetrics(userId, db);
      return {
        content: [{ type: "text", text: JSON.stringify(result.metrics, null, 2) }],
      };
    },
  );

  server.tool(
    "log_body_measurement",
    "Log a body measurement for a specific metric. Call list_body_metrics first to get valid metric IDs. The user cannot log to a metric that doesn't exist.",
    {
      metric_id: z.number().int().positive().describe("ID of the body metric to log (from list_body_metrics)"),
      value: z.number().describe("Measurement value in the metric's unit"),
      recorded_at: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Date of measurement in YYYY-MM-DD format"),
    },
    async ({ metric_id, value, recorded_at }) => {
      const result = await BodyMeasurementRepo.createMeasurement(
        { metric_id, value, recorded_at, userId },
        db,
      );
      if (!result.isSuccess) {
        return {
          content: [{ type: "text", text: `Error: ${result.message}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: `Logged measurement (id: ${result.id}) successfully.` }],
      };
    },
  );

  server.tool(
    "get_body_measurements",
    "Get daily-averaged body measurements for a metric over a date range.",
    {
      metric_id: z.number().int().positive().describe("ID of the body metric"),
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Start date YYYY-MM-DD (inclusive)"),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("End date YYYY-MM-DD (inclusive)"),
    },
    async ({ metric_id, start_date, end_date }) => {
      const result = await BodyMeasurementRepo.getMeasurements(
        { metric_id, from: start_date, to: end_date, userId },
        db,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
