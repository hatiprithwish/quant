import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { Env } from "../types";
import { getDb } from "../db";
import { registerFoodTools } from "./FoodTools";
import { registerExpenseTools } from "./ExpenseTools";
import { registerTimeTools } from "./TimeTools";
import { registerBodyTools } from "./BodyTools";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

const FAKE_INIT_ID = "__stateless_init__";

const INIT_REQUEST: JSONRPCMessage = {
  jsonrpc: "2.0",
  id: FAKE_INIT_ID,
  method: "initialize",
  params: {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "stateless-proxy", version: "1.0.0" },
  },
};

const INITIALIZED_NOTIFICATION: JSONRPCMessage = {
  jsonrpc: "2.0",
  method: "notifications/initialized",
};

function buildServer(userId: string, db: ReturnType<typeof getDb>): McpServer {
  const server = new McpServer({ name: "life-tracker", version: "1.0.0" });

  registerFoodTools(server, userId, db);
  registerExpenseTools(server, userId, db);
  registerTimeTools(server, userId, db);
  registerBodyTools(server, userId, db);

  server.tool(
    "get_today",
    "Get today's date. Always call this first to avoid date errors.",
    {},
    async () => ({
      content: [
        { type: "text", text: new Date().toISOString().split("T")[0] },
      ],
    })
  );

  return server;
}

function buildTransport(): {
  transport: Transport;
  waitFor: (id: string | number | null) => Promise<JSONRPCMessage>;
} {
  const pending = new Map<
    string,
    (msg: JSONRPCMessage) => void
  >();
  const queue: JSONRPCMessage[] = [];

  const transport: Transport = {
    onmessage: undefined as ((msg: JSONRPCMessage) => void) | undefined,
    onclose: undefined,
    onerror: undefined,
    start: async () => {},
    close: async () => {},
    send: async (message) => {
      const msg = message as Record<string, unknown>;
      const id = msg["id"];
      const key = id !== undefined ? String(id) : "__notification__";
      const resolve = pending.get(key);
      if (resolve) {
        pending.delete(key);
        resolve(message);
      } else {
        queue.push(message);
      }
    },
  };

  function waitFor(
    id: string | number | null
  ): Promise<JSONRPCMessage> {
    const key = id !== null && id !== undefined ? String(id) : "__notification__";
    const queued = queue.findIndex(
      (m) => String((m as Record<string, unknown>)["id"] ?? "__notification__") === key
    );
    if (queued !== -1) {
      return Promise.resolve(queue.splice(queued, 1)[0]);
    }
    return new Promise((resolve) => pending.set(key, resolve));
  }

  return { transport, waitFor };
}

export async function handleMcpRequest(
  request: Request,
  userId: string,
  env: Env,
  correlationId: string
): Promise<Response> {
  if (request.method === "GET") {
    return new Response(
      JSON.stringify({ error: "SSE not supported in stateless mode" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  if (request.method === "DELETE") {
    return new Response(null, { status: 200 });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: JSONRPCMessage;
  try {
    body = (await request.json()) as JSONRPCMessage;
  } catch {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.MCP,
      logAction: "McpParseError",
      message: "Failed to parse MCP request body",
      metadata: { userId },
    });
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const bodyRecord = body as Record<string, unknown>;
  const method = bodyRecord["method"] as string | undefined;
  const toolName = (bodyRecord["params"] as Record<string, unknown> | undefined)?.["name"] as string | undefined;

  Logger.info({
    correlationId,
    logCategory: AppConstants.LOG_CATEGORIES.MCP,
    logAction: "McpIncomingMessage",
    message: "MCP message received",
    metadata: { userId, method, ...(toolName ? { toolName } : {}) },
  });

  const db = getDb(env.DB);
  const server = buildServer(userId, db);
  const { transport, waitFor } = buildTransport();

  await server.connect(transport);

  const isInitialize = method === "initialize";
  const hasId = "id" in bodyRecord;

  if (!isInitialize) {
    transport.onmessage?.(INIT_REQUEST);
    await waitFor(FAKE_INIT_ID);
    transport.onmessage?.(INITIALIZED_NOTIFICATION);
  }

  if (!hasId) {
    transport.onmessage?.(body);
    return new Response(null, { status: 202 });
  }

  const requestId = bodyRecord["id"] as string | number;
  transport.onmessage?.(body);
  const response = await waitFor(requestId);

  const responseRecord = response as Record<string, unknown>;
  if (responseRecord["error"]) {
    Logger.warn({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.MCP,
      logAction: "McpToolError",
      message: "MCP tool returned error",
      metadata: { userId, method, ...(toolName ? { toolName } : {}), error: responseRecord["error"] },
    });
  } else {
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.MCP,
      logAction: "McpToolSuccess",
      message: "MCP tool completed",
      metadata: { userId, method, ...(toolName ? { toolName } : {}) },
    });
  }

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}
