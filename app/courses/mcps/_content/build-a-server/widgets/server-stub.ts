/**
 * Parsed-stub MCP server used by `ServerEditor` (Ch 6).
 *
 * Decision recorded (issue #75, ServerEditor ambition):
 *   We chose the **parsed-stub** approach, NOT a sandboxed `Function`
 *   evaluator. The reader doesn't write JS; they fill out a small
 *   registration form (name, description, JSON-Schema-shaped fields, a
 *   URI template, prompt arguments) and the widget synthesises the
 *   JSON-RPC response from those declarations. Why:
 *     - Safety. No `eval`, no Function-from-string, no Worker boundary.
 *     - Simpler. Ships in one turn; the lesson is *registration*, not
 *       handler-implementation.
 *     - Pedagogically truer to the spec — the SDK's `registerTool`
 *       takes a description + input schema + (optional) handler;
 *       what the *model* sees is the description and the schema, not
 *       the handler body. Editing a form mirrors that.
 *
 * Spec version we model: 2025-06-18.
 *
 * The dispatcher here is a slimmer cousin of
 * `app/courses/mcps/_content/json-rpc-the-wire/widgets/server-stub.ts`
 * (Ch 3). Different surface — Ch 3's stub has fixed canned responses;
 * this one closes over the reader's *current* registrations passed in.
 */

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
};

export type JsonRpcOk = {
  jsonrpc: "2.0";
  id: number | string;
  result: unknown;
};

export type JsonRpcErr = {
  jsonrpc: "2.0";
  id: number | string | null;
  error: { code: number; message: string; data?: unknown };
};

export type JsonRpcResponse = JsonRpcOk | JsonRpcErr;

const PROTOCOL_VERSION = "2025-06-18";

/**
 * A field declaration in a tool's input schema. Keeps the form simple:
 * a name, a JSON-Schema-style type, an optional description, and a
 * `required` flag. No nested objects — the lesson is the SHAPE, not
 * the schema-language's full power.
 */
export type SchemaField = {
  name: string;
  type: "string" | "number" | "boolean";
  description?: string;
  required: boolean;
};

export type ToolDecl = {
  id: string;
  name: string;
  description: string;
  /** Each field becomes one property in the synthesized JSON Schema. */
  inputSchema: SchemaField[];
};

export type ResourceDecl = {
  id: string;
  /** A URI template like `notes://{id}` or `weather://{city}/today`. */
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
};

export type PromptArg = {
  name: string;
  description?: string;
  required: boolean;
};

export type PromptDecl = {
  id: string;
  name: string;
  description: string;
  arguments: PromptArg[];
  /** A small template body. `{name}` placeholders get substituted at get-time. */
  template: string;
};

export type Registry = {
  tools: ToolDecl[];
  resources: ResourceDecl[];
  prompts: PromptDecl[];
};

/** What the synthesizer hands back to the widget for rendering. */
export type Outcome =
  | { kind: "response"; payload: JsonRpcResponse }
  | { kind: "error"; payload: JsonRpcErr };

/** Build a JSON Schema object from a flat list of fields. */
export function fieldsToJsonSchema(fields: SchemaField[]): {
  type: "object";
  properties: Record<string, { type: string; description?: string }>;
  required: string[];
} {
  const properties: Record<string, { type: string; description?: string }> = {};
  const required: string[] = [];
  for (const f of fields) {
    properties[f.name] = f.description
      ? { type: f.type, description: f.description }
      : { type: f.type };
    if (f.required) required.push(f.name);
  }
  return { type: "object", properties, required };
}

/**
 * Substitute `{var}` placeholders in a string from a params object.
 * Anything left unsubstituted becomes the literal `{var}` so the reader
 * sees what they forgot to pass.
 */
export function substitute(
  template: string,
  params: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? params[key] : `{${key}}`,
  );
}

/**
 * Extract `{name}` placeholders from a URI template.
 */
export function extractPlaceholders(template: string): string[] {
  const out: string[] = [];
  const re = /\{(\w+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/**
 * Synthesize a JSON-RPC response against the reader's current registry.
 * The widget passes a method + params + the registry; we never run user
 * code, we just describe what the SDK *would* return.
 */
export function synth(
  id: number | string,
  method: string,
  params: Record<string, unknown>,
  reg: Registry,
): Outcome {
  switch (method) {
    case "tools/list":
      return ok(id, {
        tools: reg.tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: fieldsToJsonSchema(t.inputSchema),
        })),
      });

    case "tools/call": {
      const toolName = (params.name as string | undefined) ?? "";
      if (!toolName) return invalidParams(id, 'missing required field "name"');
      const tool = reg.tools.find((t) => t.name === toolName);
      if (!tool) {
        return ok(id, {
          content: [
            { type: "text", text: `tool "${toolName}" is not registered` },
          ],
          isError: true,
        });
      }
      const args = (params.arguments as Record<string, unknown> | undefined) ?? {};
      // Validate required fields are present — the lesson is that schemas
      // matter; a host validates against them before the handler runs.
      const missing = tool.inputSchema
        .filter((f) => f.required && !(f.name in args))
        .map((f) => f.name);
      if (missing.length > 0) {
        return ok(id, {
          content: [
            {
              type: "text",
              text: `validation error · missing required argument(s): ${missing.join(", ")}`,
            },
          ],
          isError: true,
        });
      }
      // Echo the call as the synthesized response — the SDK would have
      // routed this to the handler; we render the shape the model receives.
      return ok(id, {
        content: [
          {
            type: "text",
            text: `(synth) ${tool.name} called with ${JSON.stringify(args)} — handler would return its result here.`,
          },
        ],
        isError: false,
      });
    }

    case "resources/list":
      return ok(id, {
        resources: reg.resources.map((r) => ({
          uri: r.uriTemplate,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        })),
      });

    case "resources/read": {
      const uri = (params.uri as string | undefined) ?? "";
      if (!uri) return invalidParams(id, 'missing required field "uri"');
      // Match the reader's URI against templates: same scheme, same shape.
      const resource = reg.resources.find((r) => matches(r.uriTemplate, uri));
      if (!resource) {
        return ok(id, {
          contents: [],
          isError: true,
          content: [
            { type: "text", text: `no registered resource matches "${uri}"` },
          ],
        });
      }
      return ok(id, {
        contents: [
          {
            uri,
            mimeType: resource.mimeType,
            text: `(synth) handler would read ${uri} and return ${resource.mimeType} content.`,
          },
        ],
      });
    }

    case "prompts/list":
      return ok(id, {
        prompts: reg.prompts.map((p) => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments,
        })),
      });

    case "prompts/get": {
      const promptName = (params.name as string | undefined) ?? "";
      if (!promptName)
        return invalidParams(id, 'missing required field "name"');
      const prompt = reg.prompts.find((p) => p.name === promptName);
      if (!prompt) return methodNotFound(id, `prompts/get · "${promptName}"`);
      const args = (params.arguments as Record<string, string> | undefined) ?? {};
      const missing = prompt.arguments
        .filter((a) => a.required && !(a.name in args))
        .map((a) => a.name);
      if (missing.length > 0) {
        return ok(id, {
          messages: [],
          isError: true,
          content: [
            {
              type: "text",
              text: `validation error · missing required argument(s): ${missing.join(", ")}`,
            },
          ],
        });
      }
      const rendered = substitute(prompt.template, args);
      return ok(id, {
        description: prompt.description,
        messages: [
          {
            role: "user",
            content: { type: "text", text: rendered },
          },
        ],
      });
    }

    default:
      return methodNotFound(id, method);
  }
}

/**
 * URI matcher that respects placeholder syntax. `notes://{id}` matches
 * `notes://abc` (capturing `id=abc`) but not `weather://abc`. Returns
 * true on a structural match — the widget doesn't need the captures to
 * synthesize a response.
 */
function matches(template: string, uri: string): boolean {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Now restore the placeholder syntax (we escaped its braces above).
  const pattern = escaped.replace(/\\\{\w+\\\}/g, "[^/]+");
  return new RegExp(`^${pattern}$`).test(uri);
}

function ok(id: number | string, result: unknown): Outcome {
  return { kind: "response", payload: { jsonrpc: "2.0", id, result } };
}

function invalidParams(id: number | string, detail: string): Outcome {
  return {
    kind: "error",
    payload: {
      jsonrpc: "2.0",
      id,
      error: { code: -32602, message: "Invalid params", data: detail },
    },
  };
}

function methodNotFound(id: number | string, method: string): Outcome {
  return {
    kind: "error",
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

/**
 * The default demo registry — the chapter's worked example. Mirrors the
 * brainstormer's `currency-server` proposal in shape. The reader can
 * edit / add / remove from any of the three lists.
 */
export const DEFAULT_REGISTRY: Registry = {
  tools: [
    {
      id: "convert",
      name: "convert",
      description:
        "Convert an amount from one currency to another at the latest rate.",
      inputSchema: [
        { name: "from", type: "string", description: "ISO currency code", required: true },
        { name: "to", type: "string", description: "ISO currency code", required: true },
        { name: "amount", type: "number", description: "Amount in 'from' currency", required: true },
      ],
    },
  ],
  resources: [
    {
      id: "rates",
      uriTemplate: "rates://{date}",
      name: "Daily rates",
      description: "FX rates for a given ISO date (YYYY-MM-DD).",
      mimeType: "application/json",
    },
  ],
  prompts: [
    {
      id: "recommend",
      name: "recommend-currency-mix",
      description:
        "Suggest a multi-currency holding split for a target country.",
      arguments: [
        { name: "country", description: "ISO country code", required: true },
        { name: "horizon", description: "Holding horizon, e.g. '6m'", required: false },
      ],
      template:
        "Recommend a currency mix for someone holding cash for travel to {country} over a horizon of {horizon}. Justify briefly.",
    },
  ],
};
