"use client";

/**
 * RootsManager — a small editor for the client's declared roots.
 *
 * Pedagogical role: roots are the directories the client tells the server
 * "operate inside these." Coordination, NOT enforcement — the server
 * SHOULD respect them, but nothing on the wire stops a malicious server
 * from ignoring the list. (That sentence sets up chapter 9.)
 *
 * UX: a list of file:// URIs. Add, remove, and watch the
 * `notifications/roots/list_changed` envelope render every time the list
 * changes — the very notification a real client would emit.
 *
 * Two roles in the chapter:
 *   - Standalone (Content.tsx, around the roots beat) — full WidgetShell,
 *     two-pane (editor + envelope log).
 *   - Embedded inside ReverseFlowDiagram's "roots" tab (compact mode).
 */

import { useState, useId, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

type Envelope = {
  id: number;
  method: "notifications/roots/list_changed" | "roots/list (response)";
  ts: string;
  body: string;
};

const INITIAL_ROOTS = [
  "file:///Users/ada/projects/bytesize",
  "file:///Users/ada/Documents/specs",
];

type RootsManagerProps = {
  /** Compact = no WidgetShell. Default false. */
  compact?: boolean;
  /** Optional callback fired whenever the roots list changes. Lets the
   *  parent diagram surface that the notification fired. */
  onChange?: (roots: string[]) => void;
};

export function RootsManager({ compact = false, onChange }: RootsManagerProps) {
  const reduce = useReducedMotion();
  const inputId = useId();
  const [roots, setRoots] = useState<string[]>(INITIAL_ROOTS);
  const [draft, setDraft] = useState("");
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const counterRef = useRef(0);

  const fireEnvelope = (
    method: Envelope["method"],
    nextRoots: string[],
  ) => {
    counterRef.current += 1;
    const ts = new Date().toLocaleTimeString(undefined, {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    });
    const body =
      method === "notifications/roots/list_changed"
        ? `{
  "jsonrpc": "2.0",
  "method": "notifications/roots/list_changed"
}`
        : `{
  "jsonrpc": "2.0",
  "id": ${counterRef.current},
  "result": {
    "roots": [
${nextRoots.map((r) => `      { "uri": "${r}" }`).join(",\n")}
    ]
  }
}`;
    setEnvelopes((prev) =>
      [{ id: counterRef.current, method, ts, body }, ...prev].slice(0, 6),
    );
  };

  const addRoot = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    // Permissive normalisation — accept plain paths and prepend file://.
    const normalised = /^[a-z]+:\/\//i.test(trimmed)
      ? trimmed
      : `file://${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
    if (roots.includes(normalised)) {
      setDraft("");
      return;
    }
    const next = [...roots, normalised];
    setRoots(next);
    setDraft("");
    playSound("Pop");
    fireEnvelope("notifications/roots/list_changed", next);
    onChange?.(next);
  };

  const removeRoot = (uri: string) => {
    const next = roots.filter((r) => r !== uri);
    setRoots(next);
    playSound("Click");
    fireEnvelope("notifications/roots/list_changed", next);
    onChange?.(next);
  };

  const simulateRootsList = () => {
    playSound("Progress-Tick");
    fireEnvelope("roots/list (response)", roots);
  };

  const editor = (
    <div className="bs-roots-grid">
      <div className="bs-roots-editor">
        <div className="bs-roots-eyebrow">
          <span>your declared roots</span>
          <span className="bs-roots-count">{roots.length}</span>
        </div>
        <ul className="bs-roots-list" aria-label="Declared filesystem roots">
          <AnimatePresence initial={false}>
            {roots.map((r) => (
              <motion.li
                key={r}
                className="bs-roots-item"
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: 4 }}
                transition={SPRING.gentle}
              >
                <span className="bs-roots-uri">{r}</span>
                <button
                  type="button"
                  className="bs-roots-remove"
                  onClick={() => removeRoot(r)}
                  aria-label={`remove ${r}`}
                >
                  ×
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <div className="bs-roots-add">
          <label htmlFor={inputId} className="sr-only">
            new root URI or path
          </label>
          <input
            id={inputId}
            type="text"
            className="bs-roots-input"
            placeholder="file:///path/to/dir or /path/to/dir"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRoot();
              }
            }}
          />
          <button
            type="button"
            className="bs-roots-btn bs-roots-btn--primary"
            onClick={addRoot}
            disabled={!draft.trim()}
          >
            add root
          </button>
        </div>
        <button
          type="button"
          className="bs-roots-btn bs-roots-btn--ghost"
          onClick={simulateRootsList}
          aria-label="Simulate the server calling roots/list"
        >
          ← simulate server calling roots/list
        </button>
      </div>
      <div className="bs-roots-log">
        <div className="bs-roots-log-head">envelope log</div>
        {envelopes.length === 0 ? (
          <div className="bs-roots-log-empty">
            Add or remove a root to fire a{" "}
            <code style={{ fontFamily: "var(--font-mono)" }}>
              notifications/roots/list_changed
            </code>{" "}
            envelope. The server-side button simulates a{" "}
            <code style={{ fontFamily: "var(--font-mono)" }}>roots/list</code>{" "}
            response.
          </div>
        ) : (
          <ul className="bs-roots-log-list">
            <AnimatePresence initial={false}>
              {envelopes.map((env) => (
                <motion.li
                  key={env.id}
                  className="bs-roots-log-item"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRING.gentle}
                >
                  <div className="bs-roots-log-meta">
                    <span className="bs-roots-log-method">{env.method}</span>
                    <span className="bs-roots-log-ts">{env.ts}</span>
                  </div>
                  <pre className="bs-roots-log-body">{env.body}</pre>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );

  const styles = (
    <style>{`
      .bs-roots-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
      @container widget (min-width: 640px) {
        .bs-roots-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      .bs-roots-editor {
        background: var(--color-surface);
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }
      .bs-roots-eyebrow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: var(--font-sans);
        font-size: var(--text-ui);
        color: var(--color-text);
      }
      .bs-roots-count {
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid var(--color-accent);
        color: var(--color-accent);
        background: color-mix(in oklab, var(--color-accent) 8%, transparent);
      }
      .bs-roots-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 60px;
      }
      .bs-roots-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: 6px 8px;
        background: var(--color-bg);
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-sm);
      }
      .bs-roots-uri {
        flex: 1 1 auto;
        font-family: var(--font-mono);
        font-size: 11.5px;
        color: var(--color-text);
        overflow-x: auto;
        white-space: nowrap;
      }
      .bs-roots-remove {
        flex: 0 0 auto;
        min-width: 32px;
        min-height: 32px;
        font-family: var(--font-sans);
        font-size: 18px;
        line-height: 1;
        color: var(--color-text-muted);
        background: transparent;
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-sm);
        cursor: pointer;
      }
      .bs-roots-remove:hover { color: var(--color-accent); border-color: var(--color-accent); }
      .bs-roots-remove:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 1px;
      }
      .bs-roots-add {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }
      .bs-roots-input {
        flex: 1 1 200px;
        min-height: 44px;
        padding: 8px 10px;
        font-family: var(--font-mono);
        font-size: var(--text-small);
        background: var(--color-bg);
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-sm);
        color: var(--color-text);
      }
      .bs-roots-input:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 1px;
        border-color: var(--color-accent);
      }
      .bs-roots-btn {
        min-height: 44px;
        padding: 8px 14px;
        font-family: var(--font-sans);
        font-size: var(--text-ui);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-rule);
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
      }
      .bs-roots-btn:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .bs-roots-btn--primary {
        border-color: var(--color-accent);
        color: var(--color-accent);
        background: color-mix(in oklab, var(--color-accent) 12%, transparent);
      }
      .bs-roots-btn--primary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .bs-roots-btn--ghost {
        font-size: var(--text-small);
        color: var(--color-text-muted);
      }
      .bs-roots-log {
        background: var(--color-surface);
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-md);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 380px;
      }
      .bs-roots-log-head {
        padding: 8px var(--spacing-sm);
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--color-text-muted);
        text-transform: lowercase;
        letter-spacing: 0.02em;
        border-bottom: 1px solid var(--color-rule);
      }
      .bs-roots-log-empty {
        padding: var(--spacing-md);
        font-family: var(--font-serif);
        font-size: var(--text-small);
        color: var(--color-text-muted);
        line-height: 1.55;
      }
      .bs-roots-log-list {
        list-style: none;
        margin: 0;
        padding: 0;
        overflow-y: auto;
        flex: 1 1 auto;
      }
      .bs-roots-log-item {
        border-bottom: 1px solid var(--color-rule);
        padding: 8px var(--spacing-sm);
      }
      .bs-roots-log-item:last-child { border-bottom: 0; }
      .bs-roots-log-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-sm);
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--color-text-muted);
        margin-bottom: 4px;
      }
      .bs-roots-log-method {
        color: var(--color-accent);
      }
      .bs-roots-log-body {
        font-family: var(--font-mono);
        font-size: 11px;
        line-height: 1.5;
        color: var(--color-text);
        margin: 0;
        white-space: pre;
        overflow-x: auto;
      }
    `}</style>
  );

  if (compact) {
    return (
      <>
        {styles}
        {editor}
      </>
    );
  }

  return (
    <WidgetShell
      title="Roots — what the client tells the server it can touch"
      caption={
        <>
          The list on the left is what the client declares; the log on the
          right is the wire. Add or remove a path and watch the{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>
            notifications/roots/list_changed
          </code>{" "}
          envelope fire.
        </>
      }
    >
      {styles}
      {editor}
    </WidgetShell>
  );
}

export default RootsManager;
