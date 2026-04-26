"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WidgetShell } from "./WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

const HL_COLOR =
  "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

/**
 * A 3 × 4 cost matrix for §6 — "the cost moved, it didn't vanish."
 * Rows: the three failure modes named in the prose (proxy fallback, reconnect
 * storm, fanout). Columns: the four mechanisms covered in the post (polling,
 * long polling, SSE, WebSocket). Each cell is a verb: how does this protocol
 * behave under this failure mode?
 *
 * Interaction: tap a row to isolate one failure mode and read its detail. The
 * matrix dimensions never change — only colors and opacities animate (frame
 * stability hard rule R6). Mobile-first authoring: the four-column grid
 * reflows fluidly down to ≤ 340 px container width.
 */

type Severity = 0 | 1 | 2; // 0 = clean, 1 = costly, 2 = breaks

type Protocol = "polling" | "longpoll" | "sse" | "websocket";

const PROTOCOLS: { key: Protocol; label: string }[] = [
  { key: "polling", label: "polling" },
  { key: "longpoll", label: "long-poll" },
  { key: "sse", label: "SSE" },
  { key: "websocket", label: "WebSocket" },
];

type Mode = {
  key: string;
  label: string;
  cells: Record<Protocol, { verb: string; severity: Severity }>;
  note: string;
};

const MODES: Mode[] = [
  {
    key: "fallback",
    label: "proxy fallback",
    cells: {
      polling: { verb: "passes", severity: 0 },
      longpoll: { verb: "passes", severity: 0 },
      sse: { verb: "passes", severity: 0 },
      websocket: { verb: "stalls", severity: 2 },
    },
    note: "Corporate proxies, transparent caches, and some antivirus silently mis-handle the WebSocket Upgrade header. Plain-HTTP transports pass through unchanged — which is why Socket.IO still opens every connection on long polling first.",
  },
  {
    key: "reconnect",
    label: "reconnect storm",
    cells: {
      polling: { verb: "spreads", severity: 0 },
      longpoll: { verb: "spikes", severity: 2 },
      sse: { verb: "cushions", severity: 1 },
      websocket: { verb: "spikes", severity: 2 },
    },
    note: "When a gateway blips, every long-poll and WebSocket client races back at the same instant — Discord's stampede took 17.5 s on a ring-lookup until cached. SSE cushions with built-in Last-Event-ID resume; polling spreads across its existing tick offsets.",
  },
  {
    key: "fanout",
    label: "fanout (one event → N clients)",
    cells: {
      polling: { verb: "dodges", severity: 0 },
      longpoll: { verb: "wakes N", severity: 2 },
      sse: { verb: "writes N", severity: 1 },
      websocket: { verb: "frames N", severity: 1 },
    },
    note: "Polling dodges the fanout problem entirely — the server never pushes; it answers when asked, often from cache. Long polling wakes O(N) hung requests on every event. SSE and WebSocket pay O(N) writes too, but on persistent streams the per-event cost is bytes, not full HTTP rounds.",
  },
];

export function CostMatrix() {
  const [active, setActive] = useState<string | null>(null);
  const focus = MODES.find((m) => m.key === active) ?? null;

  return (
    <WidgetShell
      title="where the cost reappears"
      measurements={focus ? `focus · ${focus.label}` : "3 modes · 4 protocols"}
      captionTone="prominent"
      caption={
        <AnimatePresence mode="wait">
          <motion.span
            key={focus?.key ?? "none"}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={SPRING.snappy}
          >
            {focus ? (
              focus.note
            ) : (
              <>
                Each cell is what the protocol does when this failure mode
                hits. Darker means costlier.{" "}
                <TextHighlighter
                  triggerType="auto"
                  transition={HL_TX}
                  highlightColor={HL_COLOR}
                  className="rounded-[0.2em] px-[1px]"
                >
                  Tap a row to read the detail.
                </TextHighlighter>
              </>
            )}
          </motion.span>
        </AnimatePresence>
      }
    >
      <div className="bs-cm">
        {/* header row with protocol names */}
        <div className="bs-cm-header">
          <span />
          {PROTOCOLS.map((p) => (
            <span key={p.key} className="bs-cm-col">
              {p.label}
            </span>
          ))}
        </div>

        {MODES.map((m) => {
          const isActive = active === m.key;
          const dimmed = active !== null && !isActive;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                playSound("Toggle-On");
                setActive(isActive ? null : m.key);
              }}
              aria-pressed={isActive}
              aria-label={`${m.label} failure mode — press to read detail`}
              className="bs-cm-row"
              style={{
                opacity: dimmed ? 0.45 : 1,
              }}
            >
              <span className="bs-cm-label">{m.label}</span>
              {PROTOCOLS.map((p) => {
                const cell = m.cells[p.key];
                return (
                  <Cell
                    key={p.key}
                    verb={cell.verb}
                    severity={cell.severity}
                    active={isActive}
                  />
                );
              })}
            </button>
          );
        })}

        {/* legend */}
        <div className="bs-cm-legend font-sans">
          <LegendSwatch severity={0} /> clean
          <LegendSwatch severity={1} /> costly
          <LegendSwatch severity={2} /> breaks
        </div>
      </div>

      <style>{`
        .bs-cm {
          display: grid;
          gap: var(--spacing-sm);
        }
        .bs-cm-header,
        .bs-cm-row {
          display: grid;
          grid-template-columns: minmax(120px, 148px) repeat(4, 1fr);
          gap: 4px;
          align-items: stretch;
        }
        .bs-cm-row {
          padding: var(--spacing-2xs);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: border-color 200ms, background 200ms, opacity 200ms;
          min-height: 48px;
          color: inherit;
        }
        .bs-cm-row:hover {
          border-color: var(--color-rule);
        }
        .bs-cm-row[aria-pressed="true"] {
          border-color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 6%, transparent);
        }
        .bs-cm-col {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          text-align: center;
          line-height: 1.2;
          overflow-wrap: break-word;
          align-self: end;
          padding-bottom: 4px;
        }
        .bs-cm-label {
          font-family: var(--font-sans);
          font-size: var(--text-ui);
          font-weight: 600;
          color: var(--color-text);
          align-self: center;
        }
        .bs-cm-legend {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--spacing-sm);
          padding-top: var(--spacing-sm);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          margin-left: 152px;
        }
        @container widget (max-width: 560px) {
          .bs-cm-header,
          .bs-cm-row {
            grid-template-columns: 96px repeat(4, 1fr);
          }
          .bs-cm-col {
            font-size: 9px;
          }
          .bs-cm-legend {
            margin-left: 0;
          }
        }
        @container widget (max-width: 380px) {
          .bs-cm-header,
          .bs-cm-row {
            grid-template-columns: 78px repeat(4, 1fr);
            gap: 3px;
          }
          .bs-cm-label {
            font-size: var(--text-small);
          }
        }
      `}</style>
    </WidgetShell>
  );
}

function Cell({
  verb,
  severity,
  active,
}: {
  verb: string;
  severity: Severity;
  active: boolean;
}) {
  const fill =
    severity === 2
      ? "color-mix(in oklab, var(--color-accent) 70%, transparent)"
      : severity === 1
        ? "color-mix(in oklab, var(--color-accent) 32%, transparent)"
        : "color-mix(in oklab, var(--color-accent) 8%, transparent)";
  const textColor =
    severity === 2
      ? "var(--color-bg)"
      : "var(--color-text)";
  return (
    <motion.span
      initial={false}
      animate={{
        background: fill,
        opacity: active && severity === 0 ? 0.55 : 1,
      }}
      transition={SPRING.smooth}
      aria-hidden
      className="font-mono"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "6px 4px",
        minHeight: 32,
        borderRadius: 4,
        border: "1px solid color-mix(in oklab, var(--color-rule) 60%, transparent)",
        fontSize: 11,
        letterSpacing: "0.02em",
        lineHeight: 1.2,
        color: textColor,
        overflowWrap: "break-word",
        wordBreak: "break-word",
      }}
    >
      {verb}
    </motion.span>
  );
}

function LegendSwatch({ severity }: { severity: Severity }) {
  const fill =
    severity === 2
      ? "color-mix(in oklab, var(--color-accent) 70%, transparent)"
      : severity === 1
        ? "color-mix(in oklab, var(--color-accent) 32%, transparent)"
        : "color-mix(in oklab, var(--color-accent) 8%, transparent)";
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 3,
        background: fill,
        border: "1px solid var(--color-rule)",
        verticalAlign: "middle",
        marginRight: 6,
        marginLeft: 12,
      }}
    />
  );
}
