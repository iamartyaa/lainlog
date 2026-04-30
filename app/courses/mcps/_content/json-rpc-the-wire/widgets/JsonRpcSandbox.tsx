"use client";

/**
 * JsonRpcSandbox — the chapter's load-bearing widget.
 *
 * Two panes: an editable JSON-RPC request on the left, the deterministic
 * server-stub's response on the right. The reader edits the request and
 * watches the response shape change live — they internalise the four spec
 * fields (jsonrpc / id / method / params) by editing them, not by reading
 * about them.
 *
 * Why not a full editor lib (CodeMirror / Monaco)?
 *   - We render a plain monospaced <textarea>. JSON-RPC is small; an editor
 *     primitive would dominate the JS bundle for a couple of hundred bytes
 *     of payload. Tabs and copy/paste already work.
 *   - The lesson is the protocol shape, not the editing UX.
 *
 * Determinism is the lesson. Every preset, every keystroke, dispatches
 * through `parseAndDispatch` (see `./server-stub.ts`) — no `eval`, no
 * network, no race. Given the same JSON, the response is identical across
 * sessions and devices.
 *
 * Frame-stability (DESIGN.md R6 / svg-cover-playbook.md R6): both panes have
 * fixed min-heights. A parse error doesn't shrink the response pane; a
 * notification doesn't grow the editor.
 *
 * A11y:
 *   - <textarea> is a real <textarea> with a label.
 *   - Preset chips are real <button>s with role="radio" inside a radiogroup.
 *   - Response pane is `aria-live="polite"`, debounced so SR users hear one
 *     announcement per edit, not one per keystroke.
 *
 * Reduced motion: no transitions, no entrance animations. The widget is
 * pure I/O — there's nothing to animate. It works equally well still or
 * lively.
 *
 * Mobile (375px): panes stack vertically (editor on top); editor capped at
 * ~38vh so the response pane stays visible without scrolling the shell.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { parseAndDispatch, PRESETS, type StubOutcome } from "./server-stub";

const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";

/**
 * Renders the right pane — either a JSON response, a "(notification —
 * no response)" placeholder, or a parse-error response.
 */
function renderOutcome(outcome: StubOutcome): {
  body: string;
  badge: string;
  tone: "ok" | "error" | "muted";
} {
  if (outcome.kind === "notification") {
    return {
      body: "(notification — no response)",
      badge: "fire-and-forget",
      tone: "muted",
    };
  }
  if (outcome.kind === "parse-error") {
    return {
      body: JSON.stringify(outcome.payload, null, 2),
      badge: "parse error · -32700",
      tone: "error",
    };
  }
  const payload = outcome.payload;
  const isErr = "error" in payload;
  return {
    body: JSON.stringify(payload, null, 2),
    badge: isErr
      ? `error · ${payload.error.code}`
      : `response · id ${String(payload.id)}`,
    tone: isErr ? "error" : "ok",
  };
}

const DEBOUNCE_MS = 200;

export function JsonRpcSandbox() {
  const [text, setText] = useState<string>(PRESETS[1].body); // tools/list
  const [activePresetId, setActivePresetId] = useState<string | null>(
    PRESETS[1].id,
  );
  // Debounced eval — the textarea fires onChange on every keystroke; we
  // collapse those into a single dispatch ~200ms after the reader pauses.
  const [debounced, setDebounced] = useState<string>(text);
  const labelId = useId();
  const responseId = useId();
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimer.current !== null) {
      window.clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = window.setTimeout(() => {
      setDebounced(text);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [text]);

  const outcome = useMemo(() => parseAndDispatch(debounced), [debounced]);
  const rendered = useMemo(() => renderOutcome(outcome), [outcome]);

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setActivePresetId(id);
    setText(preset.body);
    // Bypass the debounce for an instant feel on a chip click.
    setDebounced(preset.body);
  }

  function onTextChange(next: string) {
    setActivePresetId(null);
    setText(next);
  }

  return (
    <WidgetShell
      title="json-rpc sandbox"
      measurements={
        outcome.kind === "notification"
          ? "no response"
          : outcome.kind === "parse-error"
            ? "-32700"
            : "error" in outcome.payload
              ? String(outcome.payload.error.code)
              : `id ${String(outcome.payload.id)}`
      }
      caption={
        <span>
          <TextHighlighter
            triggerType="auto"
            transition={HL_TX}
            highlightColor={HL_COLOR}
            className="rounded-[0.2em] px-[1px]"
          >
            edit the request
          </TextHighlighter>
          . change <code>method</code> to something the server doesn&rsquo;t
          know &mdash; watch the error code come back. remove the{" "}
          <code>id</code> &mdash; the response goes silent.
        </span>
      }
      controls={
        <div role="radiogroup" aria-label="preset requests" className="bs-jrs-chips">
          {PRESETS.map((p) => {
            const active = p.id === activePresetId;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => applyPreset(p.id)}
                className="bs-jrs-chip"
                data-active={active}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      }
    >
      <style>{`
        .bs-jrs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-sm);
        }
        @container (min-width: 640px) {
          .bs-jrs-grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-md);
          }
        }
        .bs-jrs-pane {
          display: flex;
          flex-direction: column;
          min-height: 220px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: var(--color-surface);
          overflow: hidden;
        }
        .bs-jrs-pane-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-bottom: 1px solid var(--color-rule);
          font-family: var(--font-mono);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          letter-spacing: 0.02em;
        }
        .bs-jrs-pane-body {
          flex: 1;
          font-family: var(--font-mono);
          font-size: var(--text-mono);
          line-height: 1.55;
          padding: var(--spacing-sm);
          color: var(--color-text);
          white-space: pre;
          overflow: auto;
          tab-size: 2;
        }
        .bs-jrs-pane-body[data-tone="muted"] {
          color: var(--color-text-muted);
          font-style: italic;
          font-family: var(--font-serif);
          white-space: normal;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .bs-jrs-textarea {
          width: 100%;
          flex: 1;
          min-height: 220px;
          max-height: 38vh;
          resize: vertical;
          font-family: var(--font-mono);
          font-size: var(--text-mono);
          line-height: 1.55;
          padding: var(--spacing-sm);
          color: var(--color-text);
          background: transparent;
          border: 0;
          outline: none;
          tab-size: 2;
        }
        .bs-jrs-textarea:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: -2px;
        }
        .bs-jrs-pane-badge {
          font-variant-numeric: tabular-nums;
        }
        .bs-jrs-pane-badge[data-tone="error"] {
          color: var(--color-accent);
        }
        .bs-jrs-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }
        .bs-jrs-chip {
          min-height: 32px;
          padding: 4px 10px;
          font-family: var(--font-mono);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          background: transparent;
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: color 200ms, border-color 200ms, background 200ms;
        }
        .bs-jrs-chip:hover {
          color: var(--color-text);
          border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-rule));
        }
        .bs-jrs-chip[data-active="true"] {
          color: var(--color-text);
          border-color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 10%, transparent);
        }
        .bs-jrs-chip:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      `}</style>

      <div className="bs-jrs-grid">
        <div className="bs-jrs-pane">
          <div className="bs-jrs-pane-head">
            <span id={labelId}>request</span>
            <span style={{ fontStyle: "italic" }}>editable</span>
          </div>
          <textarea
            aria-labelledby={labelId}
            aria-describedby={responseId}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            className="bs-jrs-textarea"
          />
        </div>

        <div className="bs-jrs-pane">
          <div className="bs-jrs-pane-head">
            <span>response</span>
            <span
              className="bs-jrs-pane-badge"
              data-tone={rendered.tone === "error" ? "error" : undefined}
            >
              {rendered.badge}
            </span>
          </div>
          <div
            id={responseId}
            className="bs-jrs-pane-body"
            data-tone={rendered.tone}
            aria-live="polite"
            aria-atomic="true"
          >
            {rendered.body}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}

export default JsonRpcSandbox;
