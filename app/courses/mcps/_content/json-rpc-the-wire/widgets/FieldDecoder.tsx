"use client";

/**
 * FieldDecoder — annotated JSON-RPC sample. Each of the four spec fields
 * (`jsonrpc`, `id`, `method`, `params`) is hoverable / focusable; selecting
 * one reveals a callout that explains its job.
 *
 * Why not Shiki here? The teaching surface needs *interactive* tokens —
 * each field is its own focusable button — and Shiki renders to opaque
 * HTML strings. We hand-render the JSON instead, with a small layout that
 * mirrors monospaced indentation. The cost is one hand-built sample; the
 * win is per-field affordances and a single accent across the chapter.
 *
 * Frame-stability: the callout slot reserves a fixed min-height, so the
 * card doesn't reflow on hover/focus.
 *
 * A11y:
 *   - Each field is a real <button> with aria-describedby pointing at its
 *     callout — screen readers announce the explanation.
 *   - Tap-to-toggle on touch devices.
 *
 * Reduced motion: the callout fades in instantly (no slide) under
 * prefers-reduced-motion. Default is a 200ms opacity transition; no
 * transform.
 */

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";

type FieldKey = "jsonrpc" | "id" | "method" | "params";

const NOTES: Record<FieldKey, { title: string; body: string }> = {
  jsonrpc: {
    title: "jsonrpc",
    body: "always the string \"2.0\". The spec version of the wire format. If it isn't \"2.0\", the receiver replies with -32600.",
  },
  id: {
    title: "id",
    body: "the pairing key. The server echoes this id on its response so the client knows which request the response belongs to. Omit it and the message becomes a notification — no response.",
  },
  method: {
    title: "method",
    body: "the name of the operation. MCP method names are namespaced — `tools/list`, `tools/call`, `notifications/tools/list_changed`. Unknown method → -32601.",
  },
  params: {
    title: "params",
    body: "the operation's input. Shape is per-method; on responses you'll see `result` (success) or `error` (failure) instead. Wrong shape → -32602.",
  },
};

export function FieldDecoder() {
  const [active, setActive] = useState<FieldKey>("method");
  const reduce = useReducedMotion();
  const note = NOTES[active];

  return (
    <WidgetShell
      title="the four fields"
      caption={
        <span>
          tap a field to read what it does. every MCP message has these four
          &mdash; learn them once, read every message after.
        </span>
      }
    >
      <style>{`
        .bs-fd-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }
        @container (min-width: 640px) {
          .bs-fd-grid {
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
            align-items: start;
          }
        }
        .bs-fd-sample {
          font-family: var(--font-mono);
          font-size: var(--text-mono);
          line-height: 1.7;
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          padding: var(--spacing-md);
          color: var(--color-text);
          white-space: pre;
          overflow-x: auto;
        }
        .bs-fd-key {
          background: transparent;
          border: 0;
          padding: 0 4px;
          margin: 0 -4px;
          font: inherit;
          color: var(--color-text);
          cursor: pointer;
          border-radius: 4px;
          border-bottom: 1px dotted color-mix(in oklab, var(--color-accent) 60%, transparent);
          transition: background 200ms, color 200ms, border-color 200ms;
        }
        .bs-fd-key:hover { background: color-mix(in oklab, var(--color-accent) 10%, transparent); }
        .bs-fd-key:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-fd-key[data-active="true"] {
          background: color-mix(in oklab, var(--color-accent) 18%, transparent);
          border-bottom-color: var(--color-accent);
        }
        .bs-fd-callout {
          min-height: 9em;
          padding: var(--spacing-sm) var(--spacing-md);
          border-left: 2px solid var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 4%, transparent);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }
        .bs-fd-callout-title {
          font-family: var(--font-mono);
          font-size: var(--text-small);
          color: var(--color-accent);
          letter-spacing: 0.04em;
          margin: 0 0 6px 0;
        }
        .bs-fd-callout-body {
          font-family: var(--font-serif);
          font-size: var(--text-body);
          line-height: 1.6;
          color: var(--color-text);
          margin: 0;
        }
      `}</style>

      <div className="bs-fd-grid">
        <pre className="bs-fd-sample" aria-label="annotated JSON-RPC request">
          {"{\n  \""}
          <button
            type="button"
            className="bs-fd-key"
            data-active={active === "jsonrpc"}
            onMouseEnter={() => setActive("jsonrpc")}
            onFocus={() => setActive("jsonrpc")}
            onClick={() => setActive("jsonrpc")}
            aria-describedby="bs-fd-note"
          >
            jsonrpc
          </button>
          {"\": \"2.0\",\n  \""}
          <button
            type="button"
            className="bs-fd-key"
            data-active={active === "id"}
            onMouseEnter={() => setActive("id")}
            onFocus={() => setActive("id")}
            onClick={() => setActive("id")}
            aria-describedby="bs-fd-note"
          >
            id
          </button>
          {"\": 2,\n  \""}
          <button
            type="button"
            className="bs-fd-key"
            data-active={active === "method"}
            onMouseEnter={() => setActive("method")}
            onFocus={() => setActive("method")}
            onClick={() => setActive("method")}
            aria-describedby="bs-fd-note"
          >
            method
          </button>
          {"\": \"tools/list\",\n  \""}
          <button
            type="button"
            className="bs-fd-key"
            data-active={active === "params"}
            onMouseEnter={() => setActive("params")}
            onFocus={() => setActive("params")}
            onClick={() => setActive("params")}
            aria-describedby="bs-fd-note"
          >
            params
          </button>
          {"\": { }\n}"}
        </pre>

        <div
          id="bs-fd-note"
          className="bs-fd-callout"
          aria-live="polite"
          style={
            reduce
              ? undefined
              : { transition: "background 200ms ease-out" }
          }
        >
          <p className="bs-fd-callout-title">{note.title}</p>
          <p className="bs-fd-callout-body">{note.body}</p>
        </div>
      </div>
    </WidgetShell>
  );
}

export default FieldDecoder;
