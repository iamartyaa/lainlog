"use client";

/**
 * ServerEditor — chapter 6's load-bearing widget.
 *
 * Decision recorded (issue #75 ServerEditor ambition): PARSED-STUB.
 *   The reader does not write JS. They edit a small set of registration
 *   forms — name, description, JSON-Schema-shaped fields, URI templates,
 *   prompt arguments — and the widget synthesizes the JSON-RPC responses
 *   the SDK *would* return from those declarations. No `eval`, no
 *   `Function`-from-string, no Web Worker. The lesson is registration —
 *   what the model sees, what the host validates against, what the URI
 *   template addresses — not handler-implementation.
 *
 * UX:
 *   - Three tabs: Tools, Resources, Prompts.
 *   - Each tab lists the reader's current registrations + an "add" form.
 *   - Below the tabs sits a "try it" panel that lets the reader fire one
 *     of `tools/list`, `tools/call`, `resources/list`, `resources/read`,
 *     `prompts/list`, `prompts/get` against the registry; the synthesized
 *     response renders in the right pane.
 *   - A "reset demo" button restores the chapter's currency-server example.
 *
 * Accessibility:
 *   - Tabs are real <button role="tab">; tab panels carry aria-labelledby.
 *   - All inputs carry visible labels and matching <label htmlFor>.
 *   - Response region is aria-live="polite".
 *
 * Reduced motion: snap; tab content swaps without crossfade. The frame is
 * the same height regardless of state (R6 — no relayout on tab switch).
 *
 * Mobile (≤ 560 px container): tabs stay a row of buttons; the registry
 * list and "try it" panel stack vertically. Hit zones are ≥ 36 px tall.
 *
 * Single accent: the active tab + the "send" button + the call-strip's
 * "ok" pill are terracotta. Errors / info read via muted text + a dashed
 * border, never red.
 */

import {
  useCallback,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { playSound } from "@/lib/audio";
import {
  DEFAULT_REGISTRY,
  extractPlaceholders,
  fieldsToJsonSchema,
  synth,
  type JsonRpcResponse,
  type PromptDecl,
  type Registry,
  type ResourceDecl,
  type SchemaField,
  type ToolDecl,
} from "./server-stub";
import { LiveCallStrip, type CallLogEntry } from "./LiveCallStrip";
import "./server-editor.css";

type TabKey = "tools" | "resources" | "prompts";

type Method =
  | "tools/list"
  | "tools/call"
  | "resources/list"
  | "resources/read"
  | "prompts/list"
  | "prompts/get";

const TABS: { key: TabKey; label: string }[] = [
  { key: "tools", label: "tools" },
  { key: "resources", label: "resources" },
  { key: "prompts", label: "prompts" },
];

let CALL_ID_SEED = 1;
const nextCallId = () => `call-${CALL_ID_SEED++}`;

export function ServerEditor() {
  const [registry, setRegistry] = useState<Registry>(() => clone(DEFAULT_REGISTRY));
  const [tab, setTab] = useState<TabKey>("tools");
  const [log, setLog] = useState<CallLogEntry[]>([]);

  // try-it panel state — picks differ per method
  const [method, setMethod] = useState<Method>("tools/list");
  const [callToolName, setCallToolName] = useState<string>("");
  const [callArgs, setCallArgs] = useState<Record<string, string>>({});
  const [readUri, setReadUri] = useState<string>("");
  const [promptName, setPromptName] = useState<string>("");
  const [promptArgs, setPromptArgs] = useState<Record<string, string>>({});

  // Sync sensible defaults when registry changes — pre-select first item
  // for `tools/call`, `resources/read`, `prompts/get` if current selection
  // becomes invalid.
  const ensureDefaultsForMethod = useCallback(
    (m: Method, reg: Registry) => {
      if (m === "tools/call") {
        const first = reg.tools[0];
        if (!first) {
          setCallToolName("");
          setCallArgs({});
          return;
        }
        if (!reg.tools.find((t) => t.name === callToolName)) {
          setCallToolName(first.name);
          const seed: Record<string, string> = {};
          first.inputSchema.forEach((f) => (seed[f.name] = ""));
          setCallArgs(seed);
        }
      }
      if (m === "resources/read") {
        const first = reg.resources[0];
        if (!first) {
          setReadUri("");
          return;
        }
        const placeholders = extractPlaceholders(first.uriTemplate);
        const sample = placeholders.reduce(
          (acc, ph) => acc.replace(`{${ph}}`, "example"),
          first.uriTemplate,
        );
        setReadUri(sample);
      }
      if (m === "prompts/get") {
        const first = reg.prompts[0];
        if (!first) {
          setPromptName("");
          setPromptArgs({});
          return;
        }
        if (!reg.prompts.find((p) => p.name === promptName)) {
          setPromptName(first.name);
          const seed: Record<string, string> = {};
          first.arguments.forEach((a) => (seed[a.name] = ""));
          setPromptArgs(seed);
        }
      }
    },
    [callToolName, promptName],
  );

  const onMethodChange = (m: Method) => {
    setMethod(m);
    ensureDefaultsForMethod(m, registry);
  };

  const reset = () => {
    const fresh = clone(DEFAULT_REGISTRY);
    setRegistry(fresh);
    setLog([]);
    setMethod("tools/list");
    setCallToolName("");
    setCallArgs({});
    setReadUri("");
    setPromptName("");
    setPromptArgs({});
  };

  const fire = () => {
    const id = log.length + 1;
    let request: { jsonrpc: "2.0"; id: number; method: Method; params?: Record<string, unknown> };
    let params: Record<string, unknown> = {};
    if (method === "tools/call") {
      params = { name: callToolName, arguments: typedArgs(callArgs, registry, callToolName) };
      request = { jsonrpc: "2.0", id, method, params };
    } else if (method === "resources/read") {
      params = { uri: readUri };
      request = { jsonrpc: "2.0", id, method, params };
    } else if (method === "prompts/get") {
      params = { name: promptName, arguments: promptArgs };
      request = { jsonrpc: "2.0", id, method, params };
    } else {
      request = { jsonrpc: "2.0", id, method };
    }
    const outcome = synth(id, method, params, registry);
    const response: JsonRpcResponse = outcome.payload;
    setLog((prev) => {
      const entry: CallLogEntry = {
        id: nextCallId(),
        method,
        request,
        response,
      };
      const next = [entry, ...prev];
      return next.slice(0, 5);
    });
    playSound("Click");
  };

  return (
    <WidgetShell
      title="ServerEditor — your MCP server, in the page"
      caption={
        <>
          Add, edit, or remove registrations on the left; fire a JSON-RPC
          request on the right. The widget synthesizes the response from
          your declarations — no code runs, but the shape is exactly what
          the SDK would return.
        </>
      }
    >
      <div className="bs-server-editor flex flex-col gap-[var(--spacing-md)]">
        {/* Tab strip */}
        <div
          role="tablist"
          aria-label="primitive type"
          className="flex gap-[var(--spacing-xs)] flex-wrap"
        >
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`tab-panel-${t.key}`}
                id={`tab-${t.key}`}
                onClick={() => setTab(t.key)}
                className="font-mono"
                style={{
                  padding: "calc(var(--spacing-xs) + 2px) var(--spacing-sm)",
                  fontSize: "var(--text-small)",
                  background: active
                    ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                    : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-rule)"}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  minHeight: 36,
                }}
              >
                {t.label}
                <span
                  aria-hidden
                  style={{ marginLeft: 6, color: "var(--color-text-muted)" }}
                >
                  · {countFor(t.key, registry)}
                </span>
              </button>
            );
          })}
          <span style={{ flex: 1 }} aria-hidden />
          <button
            type="button"
            onClick={reset}
            className="font-sans"
            style={{
              padding: "calc(var(--spacing-xs) + 2px) var(--spacing-sm)",
              fontSize: "var(--text-small)",
              background: "transparent",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-rule)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              minHeight: 36,
            }}
          >
            reset demo
          </button>
        </div>

        {/* Tab panel */}
        <div
          role="tabpanel"
          id={`tab-panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          {tab === "tools" && (
            <ToolsPanel
              tools={registry.tools}
              onChange={(tools) => setRegistry((r) => ({ ...r, tools }))}
            />
          )}
          {tab === "resources" && (
            <ResourcesPanel
              resources={registry.resources}
              onChange={(resources) =>
                setRegistry((r) => ({ ...r, resources }))
              }
            />
          )}
          {tab === "prompts" && (
            <PromptsPanel
              prompts={registry.prompts}
              onChange={(prompts) => setRegistry((r) => ({ ...r, prompts }))}
            />
          )}
        </div>

        {/* Try-it panel */}
        <div
          className="bs-tryit"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-rule)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-md)",
          }}
        >
          <div
            className="font-sans"
            style={{
              fontSize: "var(--text-small)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "var(--spacing-sm)",
            }}
          >
            try it · synthesised JSON-RPC
          </div>

          <div
            className="bs-tryit-grid"
            style={{
              display: "grid",
              gap: "var(--spacing-md)",
              gridTemplateColumns: "1fr",
            }}
          >
            <TryItControls
              method={method}
              onMethodChange={onMethodChange}
              registry={registry}
              callToolName={callToolName}
              setCallToolName={(name) => {
                setCallToolName(name);
                const t = registry.tools.find((tt) => tt.name === name);
                const seed: Record<string, string> = {};
                t?.inputSchema.forEach((f) => (seed[f.name] = ""));
                setCallArgs(seed);
              }}
              callArgs={callArgs}
              setCallArgs={setCallArgs}
              readUri={readUri}
              setReadUri={setReadUri}
              promptName={promptName}
              setPromptName={(name) => {
                setPromptName(name);
                const p = registry.prompts.find((pp) => pp.name === name);
                const seed: Record<string, string> = {};
                p?.arguments.forEach((a) => (seed[a.name] = ""));
                setPromptArgs(seed);
              }}
              promptArgs={promptArgs}
              setPromptArgs={setPromptArgs}
              onFire={fire}
            />
          </div>

          <div style={{ marginTop: "var(--spacing-md)" }}>
            <div
              className="font-sans"
              style={{
                fontSize: "var(--text-small)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                marginBottom: "var(--spacing-xs)",
              }}
            >
              recent calls (last 5)
            </div>
            <LiveCallStrip entries={log} />
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}

/* ───────── tools panel ───────── */

function ToolsPanel({
  tools,
  onChange,
}: {
  tools: ToolDecl[];
  onChange: (tools: ToolDecl[]) => void;
}) {
  const addTool = () => {
    const id = `tool-${Date.now()}`;
    onChange([
      ...tools,
      {
        id,
        name: "newTool",
        description: "",
        inputSchema: [{ name: "input", type: "string", required: true }],
      },
    ]);
  };
  return (
    <div className="flex flex-col gap-[var(--spacing-sm)]">
      {tools.length === 0 ? (
        <EmptyHint>no tools registered. add one below.</EmptyHint>
      ) : (
        tools.map((t) => (
          <ToolCard
            key={t.id}
            tool={t}
            onChange={(next) =>
              onChange(tools.map((x) => (x.id === t.id ? next : x)))
            }
            onRemove={() => onChange(tools.filter((x) => x.id !== t.id))}
          />
        ))
      )}
      <AddButton onClick={addTool} label="add tool" />
    </div>
  );
}

function ToolCard({
  tool,
  onChange,
  onRemove,
}: {
  tool: ToolDecl;
  onChange: (next: ToolDecl) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  const descId = useId();
  return (
    <Card>
      <Row>
        <Field label="name" htmlFor={nameId}>
          <input
            id={nameId}
            value={tool.name}
            onChange={(e) => onChange({ ...tool, name: e.target.value })}
            className="bs-input"
          />
        </Field>
        <RemoveButton onClick={onRemove} />
      </Row>
      <Field label="description" htmlFor={descId}>
        <textarea
          id={descId}
          value={tool.description}
          onChange={(e) => onChange({ ...tool, description: e.target.value })}
          rows={2}
          className="bs-input"
          placeholder="one-line gloss the model reads to decide WHEN to call this tool"
        />
      </Field>
      <FieldsEditor
        fields={tool.inputSchema}
        onChange={(inputSchema) => onChange({ ...tool, inputSchema })}
      />
    </Card>
  );
}

function FieldsEditor({
  fields,
  onChange,
}: {
  fields: SchemaField[];
  onChange: (next: SchemaField[]) => void;
}) {
  const update = (i: number, patch: Partial<SchemaField>) =>
    onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const add = () =>
    onChange([
      ...fields,
      { name: `field${fields.length + 1}`, type: "string", required: false },
    ]);
  const remove = (i: number) =>
    onChange(fields.filter((_, idx) => idx !== i));

  return (
    <div>
      <div
        className="font-sans"
        style={{
          fontSize: "var(--text-small)",
          color: "var(--color-text-muted)",
          marginBottom: "var(--spacing-xs)",
        }}
      >
        input schema
      </div>
      <div className="flex flex-col gap-[var(--spacing-xs)]">
        {fields.map((f, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-[var(--spacing-xs)]"
          >
            <input
              aria-label={`field ${i + 1} name`}
              value={f.name}
              onChange={(e) => update(i, { name: e.target.value })}
              className="bs-input"
              style={{ flex: "1 1 8ch", minWidth: "8ch" }}
            />
            <select
              aria-label={`field ${i + 1} type`}
              value={f.type}
              onChange={(e) =>
                update(i, { type: e.target.value as SchemaField["type"] })
              }
              className="bs-input"
              style={{ flex: "0 1 auto" }}
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
            </select>
            <label
              className="font-mono"
              style={{
                fontSize: "var(--text-small)",
                color: "var(--color-text-muted)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                minHeight: 36,
              }}
            >
              <input
                type="checkbox"
                checked={f.required}
                onChange={(e) => update(i, { required: e.target.checked })}
              />
              required
            </label>
            <RemoveButton onClick={() => remove(i)} small />
          </div>
        ))}
        <AddButton onClick={add} label="add field" small />
      </div>
    </div>
  );
}

/* ───────── resources panel ───────── */

function ResourcesPanel({
  resources,
  onChange,
}: {
  resources: ResourceDecl[];
  onChange: (resources: ResourceDecl[]) => void;
}) {
  const add = () =>
    onChange([
      ...resources,
      {
        id: `res-${Date.now()}`,
        uriTemplate: "scheme://{id}",
        name: "newResource",
        description: "",
        mimeType: "application/json",
      },
    ]);
  return (
    <div className="flex flex-col gap-[var(--spacing-sm)]">
      {resources.length === 0 ? (
        <EmptyHint>no resources registered.</EmptyHint>
      ) : (
        resources.map((r) => (
          <ResourceCard
            key={r.id}
            resource={r}
            onChange={(next) =>
              onChange(resources.map((x) => (x.id === r.id ? next : x)))
            }
            onRemove={() => onChange(resources.filter((x) => x.id !== r.id))}
          />
        ))
      )}
      <AddButton onClick={add} label="add resource" />
    </div>
  );
}

function ResourceCard({
  resource,
  onChange,
  onRemove,
}: {
  resource: ResourceDecl;
  onChange: (next: ResourceDecl) => void;
  onRemove: () => void;
}) {
  const tplId = useId();
  const nameId = useId();
  const descId = useId();
  const mimeId = useId();
  return (
    <Card>
      <Row>
        <Field label="URI template" htmlFor={tplId}>
          <input
            id={tplId}
            value={resource.uriTemplate}
            onChange={(e) =>
              onChange({ ...resource, uriTemplate: e.target.value })
            }
            className="bs-input"
            placeholder="scheme://{var}"
          />
        </Field>
        <RemoveButton onClick={onRemove} />
      </Row>
      <Row>
        <Field label="name" htmlFor={nameId}>
          <input
            id={nameId}
            value={resource.name}
            onChange={(e) => onChange({ ...resource, name: e.target.value })}
            className="bs-input"
          />
        </Field>
        <Field label="MIME" htmlFor={mimeId}>
          <input
            id={mimeId}
            value={resource.mimeType}
            onChange={(e) =>
              onChange({ ...resource, mimeType: e.target.value })
            }
            className="bs-input"
          />
        </Field>
      </Row>
      <Field label="description" htmlFor={descId}>
        <textarea
          id={descId}
          value={resource.description}
          onChange={(e) =>
            onChange({ ...resource, description: e.target.value })
          }
          rows={2}
          className="bs-input"
        />
      </Field>
    </Card>
  );
}

/* ───────── prompts panel ───────── */

function PromptsPanel({
  prompts,
  onChange,
}: {
  prompts: PromptDecl[];
  onChange: (prompts: PromptDecl[]) => void;
}) {
  const add = () =>
    onChange([
      ...prompts,
      {
        id: `prompt-${Date.now()}`,
        name: "newPrompt",
        description: "",
        arguments: [{ name: "topic", required: true }],
        template: "Tell me about {topic}.",
      },
    ]);
  return (
    <div className="flex flex-col gap-[var(--spacing-sm)]">
      {prompts.length === 0 ? (
        <EmptyHint>no prompts registered.</EmptyHint>
      ) : (
        prompts.map((p) => (
          <PromptCard
            key={p.id}
            prompt={p}
            onChange={(next) =>
              onChange(prompts.map((x) => (x.id === p.id ? next : x)))
            }
            onRemove={() => onChange(prompts.filter((x) => x.id !== p.id))}
          />
        ))
      )}
      <AddButton onClick={add} label="add prompt" />
    </div>
  );
}

function PromptCard({
  prompt,
  onChange,
  onRemove,
}: {
  prompt: PromptDecl;
  onChange: (next: PromptDecl) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  const descId = useId();
  const tplId = useId();
  return (
    <Card>
      <Row>
        <Field label="name" htmlFor={nameId}>
          <input
            id={nameId}
            value={prompt.name}
            onChange={(e) => onChange({ ...prompt, name: e.target.value })}
            className="bs-input"
          />
        </Field>
        <RemoveButton onClick={onRemove} />
      </Row>
      <Field label="description" htmlFor={descId}>
        <textarea
          id={descId}
          value={prompt.description}
          onChange={(e) => onChange({ ...prompt, description: e.target.value })}
          rows={2}
          className="bs-input"
        />
      </Field>
      <PromptArgsEditor
        args={prompt.arguments}
        onChange={(args) => onChange({ ...prompt, arguments: args })}
      />
      <Field label="template" htmlFor={tplId}>
        <textarea
          id={tplId}
          value={prompt.template}
          onChange={(e) => onChange({ ...prompt, template: e.target.value })}
          rows={3}
          className="bs-input"
          placeholder="prompt body — use {arg} for substitution"
        />
      </Field>
    </Card>
  );
}

function PromptArgsEditor({
  args,
  onChange,
}: {
  args: PromptDecl["arguments"];
  onChange: (next: PromptDecl["arguments"]) => void;
}) {
  const update = (i: number, patch: Partial<PromptDecl["arguments"][number]>) =>
    onChange(args.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const add = () =>
    onChange([...args, { name: `arg${args.length + 1}`, required: false }]);
  const remove = (i: number) => onChange(args.filter((_, idx) => idx !== i));
  return (
    <div>
      <div
        className="font-sans"
        style={{
          fontSize: "var(--text-small)",
          color: "var(--color-text-muted)",
          marginBottom: "var(--spacing-xs)",
        }}
      >
        arguments
      </div>
      <div className="flex flex-col gap-[var(--spacing-xs)]">
        {args.map((a, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-[var(--spacing-xs)]"
          >
            <input
              aria-label={`prompt arg ${i + 1} name`}
              value={a.name}
              onChange={(e) => update(i, { name: e.target.value })}
              className="bs-input"
              style={{ flex: "1 1 8ch", minWidth: "8ch" }}
            />
            <label
              className="font-mono"
              style={{
                fontSize: "var(--text-small)",
                color: "var(--color-text-muted)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                minHeight: 36,
              }}
            >
              <input
                type="checkbox"
                checked={a.required}
                onChange={(e) => update(i, { required: e.target.checked })}
              />
              required
            </label>
            <RemoveButton onClick={() => remove(i)} small />
          </div>
        ))}
        <AddButton onClick={add} label="add argument" small />
      </div>
    </div>
  );
}

/* ───────── try-it controls ───────── */

function TryItControls(props: {
  method: Method;
  onMethodChange: (m: Method) => void;
  registry: Registry;
  callToolName: string;
  setCallToolName: (name: string) => void;
  callArgs: Record<string, string>;
  setCallArgs: (next: Record<string, string>) => void;
  readUri: string;
  setReadUri: (uri: string) => void;
  promptName: string;
  setPromptName: (name: string) => void;
  promptArgs: Record<string, string>;
  setPromptArgs: (next: Record<string, string>) => void;
  onFire: () => void;
}) {
  const {
    method,
    onMethodChange,
    registry,
    callToolName,
    setCallToolName,
    callArgs,
    setCallArgs,
    readUri,
    setReadUri,
    promptName,
    setPromptName,
    promptArgs,
    setPromptArgs,
    onFire,
  } = props;

  const methodId = useId();
  const tool = registry.tools.find((t) => t.name === callToolName);
  const prompt = registry.prompts.find((p) => p.name === promptName);

  return (
    <div className="flex flex-col gap-[var(--spacing-sm)]">
      <Field label="method" htmlFor={methodId}>
        <select
          id={methodId}
          value={method}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onMethodChange(e.target.value as Method)
          }
          className="bs-input"
        >
          <option value="tools/list">tools/list</option>
          <option value="tools/call">tools/call</option>
          <option value="resources/list">resources/list</option>
          <option value="resources/read">resources/read</option>
          <option value="prompts/list">prompts/list</option>
          <option value="prompts/get">prompts/get</option>
        </select>
      </Field>

      {method === "tools/call" && (
        <>
          <Field label="tool name">
            <select
              value={callToolName}
              onChange={(e) => setCallToolName(e.target.value)}
              className="bs-input"
            >
              <option value="">— pick a tool —</option>
              {registry.tools.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          {tool && tool.inputSchema.length > 0 ? (
            <div className="flex flex-col gap-[var(--spacing-xs)]">
              <div
                className="font-sans"
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                }}
              >
                arguments
              </div>
              {tool.inputSchema.map((f) => (
                <Field
                  key={f.name}
                  label={`${f.name}${f.required ? " *" : ""}  (${f.type})`}
                >
                  <input
                    value={callArgs[f.name] ?? ""}
                    onChange={(e) =>
                      setCallArgs({ ...callArgs, [f.name]: e.target.value })
                    }
                    className="bs-input"
                  />
                </Field>
              ))}
            </div>
          ) : null}
        </>
      )}

      {method === "resources/read" && (
        <Field label="URI">
          <input
            value={readUri}
            onChange={(e) => setReadUri(e.target.value)}
            className="bs-input"
            placeholder="rates://2026-04-30"
          />
        </Field>
      )}

      {method === "prompts/get" && (
        <>
          <Field label="prompt name">
            <select
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              className="bs-input"
            >
              <option value="">— pick a prompt —</option>
              {registry.prompts.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          {prompt && prompt.arguments.length > 0 ? (
            <div className="flex flex-col gap-[var(--spacing-xs)]">
              <div
                className="font-sans"
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                }}
              >
                arguments
              </div>
              {prompt.arguments.map((a) => (
                <Field key={a.name} label={`${a.name}${a.required ? " *" : ""}`}>
                  <input
                    value={promptArgs[a.name] ?? ""}
                    onChange={(e) =>
                      setPromptArgs({ ...promptArgs, [a.name]: e.target.value })
                    }
                    className="bs-input"
                  />
                </Field>
              ))}
            </div>
          ) : null}
        </>
      )}

      <button
        type="button"
        onClick={onFire}
        className="font-sans font-semibold"
        style={{
          alignSelf: "flex-start",
          padding: "calc(var(--spacing-xs) + 4px) var(--spacing-md)",
          background: "var(--color-accent)",
          color: "var(--color-bg)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          fontSize: "var(--text-small)",
          minHeight: 36,
        }}
      >
        send →
      </button>
    </div>
  );
}

/* ───────── tiny visual primitives ───────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-[var(--spacing-sm)]"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-rule)",
        borderRadius: "var(--radius-md)",
        padding: "var(--spacing-sm) var(--spacing-md)",
      }}
    >
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-end gap-[var(--spacing-sm)]"
      style={{ width: "100%" }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-sans"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flex: "1 1 12ch",
        minWidth: "12ch",
        fontSize: "var(--text-small)",
        color: "var(--color-text-muted)",
      }}
    >
      {label}
      {children}
    </label>
  );
}

function AddButton({
  onClick,
  label,
  small,
}: {
  onClick: () => void;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono"
      style={{
        alignSelf: "flex-start",
        padding: small
          ? "4px var(--spacing-sm)"
          : "var(--spacing-xs) var(--spacing-sm)",
        background: "transparent",
        border: "1px dashed var(--color-rule)",
        borderRadius: "var(--radius-sm)",
        color: "var(--color-text-muted)",
        cursor: "pointer",
        fontSize: "var(--text-small)",
        minHeight: small ? 28 : 36,
      }}
    >
      + {label}
    </button>
  );
}

function RemoveButton({
  onClick,
  small,
}: {
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="remove"
      className="font-mono"
      style={{
        padding: small ? "2px 8px" : "4px 10px",
        background: "transparent",
        border: "1px solid var(--color-rule)",
        borderRadius: "var(--radius-sm)",
        color: "var(--color-text-muted)",
        cursor: "pointer",
        fontSize: "var(--text-small)",
        minHeight: small ? 28 : 32,
      }}
    >
      remove
    </button>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-serif"
      style={{
        padding: "var(--spacing-sm) var(--spacing-md)",
        background: "color-mix(in oklab, var(--color-surface) 50%, transparent)",
        border: "1px dashed var(--color-rule)",
        borderRadius: "var(--radius-sm)",
        color: "var(--color-text-muted)",
        fontSize: "var(--text-small)",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

/* ───────── helpers ───────── */

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function countFor(key: TabKey, reg: Registry): number {
  if (key === "tools") return reg.tools.length;
  if (key === "resources") return reg.resources.length;
  return reg.prompts.length;
}

/**
 * Coerce form-string args to the schema's declared types so the
 * synthesized `arguments` payload looks like real SDK input.
 */
function typedArgs(
  raw: Record<string, string>,
  reg: Registry,
  toolName: string,
): Record<string, unknown> {
  const tool = reg.tools.find((t) => t.name === toolName);
  if (!tool) return raw;
  const out: Record<string, unknown> = {};
  for (const f of tool.inputSchema) {
    const v = raw[f.name];
    if (v === undefined || v === "") continue;
    if (f.type === "number") {
      const n = Number(v);
      out[f.name] = Number.isFinite(n) ? n : v;
    } else if (f.type === "boolean") {
      out[f.name] = v === "true";
    } else {
      out[f.name] = v;
    }
  }
  return out;
}

export default ServerEditor;
