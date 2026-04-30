"use client";

/**
 * RequestVsNotification — toggle between a request shape and a notification
 * shape. The two messages are identical except one has an `id` and one
 * doesn't; flipping the toggle visualises what that one field decides.
 *
 * The right pane swaps between the server's response and a "(no response)"
 * placeholder. A small round-trip counter increments on request-mode flips
 * and holds on notification-mode flips — the reader feels the round-trip
 * semantics in their fingertips.
 *
 * Frame stability: both panes share a fixed min-height so a notification
 * doesn't shrink the card. Counter slot reserves a fixed pill size.
 *
 * A11y: segmented control is a real radiogroup; the counter is a
 * non-interactive status node with aria-live="polite".
 *
 * Reduced motion: opacity-only crossfade on the response pane (no slide).
 */

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { dispatch } from "./server-stub";

type Mode = "request" | "notification";

const REQUEST_MSG = {
  jsonrpc: "2.0" as const,
  id: 7,
  method: "tools/list",
};
const NOTIFICATION_MSG = {
  jsonrpc: "2.0" as const,
  method: "notifications/tools/list_changed",
};

export function RequestVsNotification() {
  const [mode, setMode] = useState<Mode>("request");
  const [roundTrips, setRoundTrips] = useState(0);
  const reduce = useReducedMotion();

  const message = mode === "request" ? REQUEST_MSG : NOTIFICATION_MSG;
  const outcome = dispatch(message);

  function pick(next: Mode) {
    if (next === mode) return;
    setMode(next);
    if (next === "request") setRoundTrips((n) => n + 1);
  }

  const responseText =
    outcome.kind === "response"
      ? JSON.stringify(outcome.payload, null, 2)
      : "(no response — notifications are fire-and-forget)";

  return (
    <WidgetShell
      title="request vs notification"
      measurements={`round-trips · ${roundTrips}`}
      caption={
        <span>
          one field decides. with an <code>id</code>, the server replies
          and the round-trip count ticks up. without an <code>id</code>,
          the wire goes quiet.
        </span>
      }
      controls={
        <div role="radiogroup" aria-label="message type" className="bs-rvn-seg">
          <button
            type="button"
            role="radio"
            aria-checked={mode === "request"}
            data-active={mode === "request"}
            onClick={() => pick("request")}
            className="bs-rvn-seg-btn"
          >
            request
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "notification"}
            data-active={mode === "notification"}
            onClick={() => pick("notification")}
            className="bs-rvn-seg-btn"
          >
            notification
          </button>
        </div>
      }
    >
      <style>{`
        .bs-rvn-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-sm);
        }
        @container (min-width: 640px) {
          .bs-rvn-grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-md);
          }
        }
        .bs-rvn-pane {
          font-family: var(--font-mono);
          font-size: var(--text-mono);
          line-height: 1.55;
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          padding: var(--spacing-md);
          min-height: 160px;
          color: var(--color-text);
          white-space: pre;
          overflow-x: auto;
        }
        .bs-rvn-pane[data-mode="muted"] {
          font-family: var(--font-serif);
          font-style: italic;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: normal;
        }
        .bs-rvn-pane-label {
          display: block;
          font-family: var(--font-mono);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          letter-spacing: 0.02em;
          margin-bottom: 6px;
        }
        .bs-rvn-seg {
          display: inline-flex;
          padding: 3px;
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
        }
        .bs-rvn-seg-btn {
          min-height: 32px;
          padding: 4px 14px;
          font-family: var(--font-mono);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          background: transparent;
          border: 0;
          border-radius: calc(var(--radius-sm) - 2px);
          cursor: pointer;
          transition: color 200ms, background 200ms;
        }
        .bs-rvn-seg-btn[data-active="true"] {
          color: var(--color-text);
          background: color-mix(in oklab, var(--color-accent) 14%, transparent);
        }
        .bs-rvn-seg-btn:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      `}</style>

      <div className="bs-rvn-grid">
        <div>
          <span className="bs-rvn-pane-label">on the wire</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.pre
              key={mode}
              className="bs-rvn-pane"
              initial={reduce ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              {JSON.stringify(message, null, 2)}
            </motion.pre>
          </AnimatePresence>
        </div>
        <div>
          <span className="bs-rvn-pane-label">what comes back</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              className="bs-rvn-pane"
              data-mode={outcome.kind === "notification" ? "muted" : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              aria-live="polite"
            >
              {responseText}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </WidgetShell>
  );
}

export default RequestVsNotification;
