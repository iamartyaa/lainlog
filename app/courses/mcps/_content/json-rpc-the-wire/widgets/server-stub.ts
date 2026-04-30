/**
 * Deterministic JSON-RPC server stub used by `JsonRpcSandbox`,
 * `RequestVsNotification`, and (visually) `FieldDecoder`.
 *
 * Why a stub and not real protocol code:
 *   - The widget runs in the browser. Importing a real MCP server would mean
 *     bundling node modules, sockets, and a JSON-RPC dispatcher we don't need.
 *   - Determinism is the lesson. The reader edits a request and watches a
 *     PREDICTABLE response — they're learning the *shape* of the protocol,
 *     not the chaos of a live network.
 *   - Safety. We never `eval` the reader's input — we parse it as JSON and
 *     dispatch on `method` / `params` shape. A misshapen request gets the
 *     real `-32700` / `-32600` / `-32601` / `-32602` codes the spec defines.
 *
 * This is the chapter's reusable asset — Ch 4's `HandshakeReplay`, Ch 7's
 * `InitFlowAnimation`, and Ch 9's `RugPullReplay` should reuse the response
 * shapes here once a second chapter wants them. Lift to `lib/mcp/stub.ts`
 * when the second consumer arrives.
 *
 * Spec version we model: 2025-06-18.
 */

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
};

export type JsonRpcResponseOk = {
  jsonrpc: "2.0";
  id: number | string;
  result: unknown;
};

export type JsonRpcResponseErr = {
  jsonrpc: "2.0";
  id: number | string | null;
  error: { code: number; message: string; data?: unknown };
};

export type JsonRpcResponse = JsonRpcResponseOk | JsonRpcResponseErr;

/** What the sandbox renders in the right pane. */
export type StubOutcome =
  | { kind: "response"; payload: JsonRpcResponse }
  | { kind: "notification" }
  | { kind: "parse-error"; payload: JsonRpcResponseErr };

const PROTOCOL_VERSION = "2025-06-18";

/**
 * Canned tool / resource / prompt surface — small enough to fit in the
 * sandbox's right pane without scroll, real enough to look like the spec.
 */
const TOOL_SURFACE = [
  {
    name: "search_flights",
    description: "Find flights between two airports on a date.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
        date: { type: "string", format: "date" },
      },
      required: ["from", "to", "date"],
    },
  },
  {
    name: "send_email",
    description: "Send an email through the connected mailbox.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
  },
] as const;

const RESOURCE_SURFACE = [
  {
    uri: "weather://forecast/sf/today",
    name: "San Francisco — today",
    mimeType: "application/json",
  },
] as const;

const PROMPT_SURFACE = [
  {
    name: "summarize_thread",
    description: "Summarize an email thread into 3 bullets.",
    arguments: [{ name: "thread_id", required: true }],
  },
] as const;

/**
 * Dispatches a parsed JSON-RPC message to its canned response. Notifications
 * (no `id`) are recognised here and short-circuit to a `notification` outcome.
 */
export function dispatch(message: unknown): StubOutcome {
  // -32600 — invalid request: not an object, missing/incorrect jsonrpc, etc.
  if (
    !message ||
    typeof message !== "object" ||
    Array.isArray(message)
  ) {
    return invalidRequest(null, "request must be a JSON object");
  }
  const m = message as Record<string, unknown>;
  if (m.jsonrpc !== "2.0") {
    return invalidRequest(
      (m.id as number | string | null) ?? null,
      'missing or invalid "jsonrpc": "2.0"',
    );
  }
  if (typeof m.method !== "string" || m.method.length === 0) {
    return invalidRequest(
      (m.id as number | string | null) ?? null,
      'missing or invalid "method"',
    );
  }

  const isNotification = !("id" in m) || m.id === undefined || m.id === null;
  if (isNotification) {
    return { kind: "notification" };
  }
  const id = m.id as number | string;
  const params = (m.params as Record<string, unknown> | undefined) ?? {};

  switch (m.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: true },
          resources: { listChanged: true, subscribe: false },
          prompts: { listChanged: true },
          logging: {},
        },
        serverInfo: { name: "demo-server", version: "0.1.0" },
      });
    case "tools/list":
      return ok(id, { tools: TOOL_SURFACE });
    case "tools/call": {
      const toolName = params.name as string | undefined;
      if (!toolName) {
        return invalidParams(id, 'missing required field "name"');
      }
      const tool = TOOL_SURFACE.find((t) => t.name === toolName);
      if (!tool) {
        return ok(id, {
          content: [
            { type: "text", text: `error: tool "${toolName}" not found` },
          ],
          isError: true,
        });
      }
      // Echo a plausible call result; we don't actually run the tool.
      return ok(id, {
        content: [
          {
            type: "text",
            text: `(stub) called ${toolName} with ${JSON.stringify(
              (params.arguments as unknown) ?? {},
            )}`,
          },
        ],
        isError: false,
      });
    }
    case "resources/list":
      return ok(id, { resources: RESOURCE_SURFACE });
    case "prompts/list":
      return ok(id, { prompts: PROMPT_SURFACE });
    default:
      return methodNotFound(id, m.method);
  }
}

/**
 * Parses a string as JSON-RPC. Returns the canonical -32700 outcome on bad
 * JSON; otherwise hands off to `dispatch`.
 */
export function parseAndDispatch(text: string): StubOutcome {
  try {
    const parsed = JSON.parse(text);
    return dispatch(parsed);
  } catch (e) {
    const detail = e instanceof Error ? e.message : "unknown parse error";
    return {
      kind: "parse-error",
      payload: {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error", data: detail },
      },
    };
  }
}

function ok(id: number | string, result: unknown): StubOutcome {
  return {
    kind: "response",
    payload: { jsonrpc: "2.0", id, result },
  };
}

function invalidRequest(
  id: number | string | null,
  detail: string,
): StubOutcome {
  return {
    kind: "response",
    payload: {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code: -32600, message: "Invalid Request", data: detail },
    },
  };
}

function invalidParams(id: number | string, detail: string): StubOutcome {
  return {
    kind: "response",
    payload: {
      jsonrpc: "2.0",
      id,
      error: { code: -32602, message: "Invalid params", data: detail },
    },
  };
}

function methodNotFound(id: number | string, method: string): StubOutcome {
  return {
    kind: "response",
    payload: {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: "Method not found",
        data: `unknown method "${method}"`,
      },
    },
  };
}

/** The presets shown as a chip strip in the sandbox. */
export const PRESETS: { id: string; label: string; body: string }[] = [
  {
    id: "initialize",
    label: "initialize",
    body: JSON.stringify(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { elicitation: {} },
          clientInfo: { name: "demo-client", version: "0.1.0" },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "tools-list",
    label: "tools/list",
    body: JSON.stringify(
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
      null,
      2,
    ),
  },
  {
    id: "tools-call",
    label: "tools/call",
    body: JSON.stringify(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "search_flights",
          arguments: { from: "SFO", to: "JFK", date: "2026-05-12" },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "notification",
    label: "notification",
    body: JSON.stringify(
      {
        jsonrpc: "2.0",
        method: "notifications/tools/list_changed",
      },
      null,
      2,
    ),
  },
  {
    id: "unknown-method",
    label: "unknown method",
    body: JSON.stringify(
      { jsonrpc: "2.0", id: 4, method: "tools/cull" },
      null,
      2,
    ),
  },
];
