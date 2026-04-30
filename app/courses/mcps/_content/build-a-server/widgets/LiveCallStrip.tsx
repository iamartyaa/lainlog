"use client";

/**
 * LiveCallStrip — a small horizontal log of the most recent JSON-RPC
 * exchanges the reader has triggered in the ServerEditor. Each entry
 * collapses to a one-line summary (method + outcome) and expands to
 * show the request and response bodies.
 *
 * Why it exists: the editor itself shows the *current* request/response;
 * the strip preserves the trail so the reader can compare a successful
 * call to a failed one without losing either. Uses the same JSON
 * presentation as Ch 3's `JsonRpcSandbox` — small <pre> blocks in the
 * surface tone — to keep visual continuity across the course.
 *
 * Reduced-motion: collapse/expand snaps. Mobile: each entry stacks its
 * request and response vertically rather than side-by-side.
 */

import { useState } from "react";
import type { JsonRpcResponse } from "./server-stub";

export type CallLogEntry = {
  /** Stable id per call so React keys are stable. */
  id: string;
  method: string;
  request: unknown;
  response: JsonRpcResponse;
};

export function LiveCallStrip({ entries }: { entries: CallLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div
        className="font-mono"
        style={{
          fontSize: "var(--text-small)",
          color: "var(--color-text-muted)",
          padding: "var(--spacing-sm) var(--spacing-md)",
          background: "color-mix(in oklab, var(--color-surface) 40%, transparent)",
          borderRadius: "var(--radius-sm)",
          border: "1px dashed var(--color-rule)",
          textAlign: "center",
        }}
        aria-live="polite"
      >
        no calls yet — issue one from the &quot;try it&quot; panel above
      </div>
    );
  }
  return (
    <ol
      className="flex flex-col gap-[var(--spacing-xs)]"
      style={{ listStyle: "none", padding: 0, margin: 0 }}
      aria-label="recent JSON-RPC exchanges"
    >
      {entries.map((e) => (
        <CallLogRow key={e.id} entry={e} />
      ))}
    </ol>
  );
}

function CallLogRow({ entry }: { entry: CallLogEntry }) {
  const [open, setOpen] = useState(false);
  const isErr = "error" in entry.response;
  return (
    <li
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-rule)",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left flex items-center justify-between gap-[var(--spacing-sm)]"
        style={{
          padding: "var(--spacing-xs) var(--spacing-sm)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-small)",
        }}
      >
        <span style={{ display: "flex", gap: "var(--spacing-sm)", alignItems: "center" }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isErr ? "var(--color-text-muted)" : "var(--color-accent)",
              display: "inline-block",
            }}
          />
          <span>{entry.method}</span>
          <span style={{ color: "var(--color-text-muted)" }}>
            · {isErr ? "error" : "ok"}
          </span>
        </span>
        <span
          aria-hidden
          style={{ color: "var(--color-text-muted)", fontSize: "var(--text-small)" }}
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div
          className="bs-callstrip-body"
          style={{
            display: "grid",
            gap: "var(--spacing-sm)",
            padding: "var(--spacing-sm)",
            borderTop: "1px solid var(--color-rule)",
            background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
          }}
        >
          <CallPre label="request" value={entry.request} />
          <CallPre label="response" value={entry.response} />
        </div>
      ) : null}
    </li>
  );
}

function CallPre({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div
        className="font-sans"
        style={{
          fontSize: "var(--text-small)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          marginBottom: "calc(var(--spacing-xs) / 2)",
        }}
      >
        {label}
      </div>
      <pre
        className="font-mono"
        style={{
          margin: 0,
          padding: "var(--spacing-xs) var(--spacing-sm)",
          background: "var(--color-bg)",
          border: "1px solid var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--text-small)",
          lineHeight: 1.5,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "var(--color-text)",
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default LiveCallStrip;
