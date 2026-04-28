type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  correlationId: string;
  logCategory: string;
  logAction: string;
  message: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
}

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const REDACTED = "[REDACTED]";
  const sensitive = new Set(["password", "token", "secret", "key", "authorization"]);
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) =>
      sensitive.has(k.toLowerCase()) ? [k, REDACTED] : [k, v]
    )
  );
}

export class Logger {
  static info(payload: Omit<LogPayload, "level">) {
    console.log(
      JSON.stringify({
        ...payload,
        level: "info",
        timestamp: new Date().toISOString(),
        metadata: payload.metadata ? sanitize(payload.metadata) : undefined,
      })
    );
  }

  static warn(payload: Omit<LogPayload, "level">) {
    console.warn(
      JSON.stringify({
        ...payload,
        level: "warn",
        timestamp: new Date().toISOString(),
        metadata: payload.metadata ? sanitize(payload.metadata) : undefined,
        error:
          payload.error instanceof Error
            ? { message: payload.error.message, stack: payload.error.stack }
            : payload.error,
      })
    );
  }

  static error(payload: Omit<LogPayload, "level">) {
    console.error(
      JSON.stringify({
        ...payload,
        level: "error",
        timestamp: new Date().toISOString(),
        metadata: payload.metadata ? sanitize(payload.metadata) : undefined,
        error:
          payload.error instanceof Error
            ? { message: payload.error.message, stack: payload.error.stack }
            : payload.error,
      })
    );
  }
}
