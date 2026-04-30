"use client";

/**
 * HandshakeStepper — the load-bearing widget for chapter 4.
 *
 * Three-message animated stepper showing the MCP handshake:
 *   1. client → server  : `initialize` request   (id, protocolVersion,
 *                                                 clientInfo, capabilities)
 *   2. server → client  : `initialize` response  (protocolVersion,
 *                                                 serverInfo, capabilities)
 *   3. client → server  : `notifications/initialized` (no id, smaller
 *                                                      envelope, distinct
 *                                                      glyph — it's a
 *                                                      notification)
 *
 * After step 3 a "session-ready" badge appears. WidgetNav drives the step
 * cursor; clicking a step header in the JSON inspector also jumps to that
 * step. Replay rewinds to step 0.
 *
 * Decisions baked in:
 * - Two horizontal lanes (client top, server bottom) at >= 480px container
 *   width; lanes stack vertically (client left, server right with a
 *   downward arrow between them) below 480px.
 * - The envelope is a small terracotta-bordered chip that translates from
 *   sender to receiver. Reduced motion drops the translation — envelopes
 *   appear at end positions instantly. The frame size is identical either
 *   way (R6 / DESIGN.md §9).
 * - One accent only — terracotta on envelope borders + active step
 *   indicator. No second hue.
 * - JSON pane to the right of the lanes (or below, on phone): every step
 *   reveals its full JSON, syntax-coloured via plain spans (no Shiki at
 *   runtime — keep this client-cheap).
 * - aria-live announces "step N of 3 — <method>" on each advance.
 */

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

type Direction = "c2s" | "s2c";

type Step = {
  /** Stable id for inspector keys. */
  id: string;
  /** Direction the envelope travels. */
  dir: Direction;
  /** Method name shown in the envelope label and aria-live. */
  method: string;
  /** Short caption shown beneath the lane diagram on this step. */
  caption: string;
  /** "request" | "response" | "notification" — drives the envelope glyph. */
  kind: "request" | "response" | "notification";
  /** JSON body shown in the inspector. */
  json: string;
};

const STEPS: Step[] = [
  {
    id: "init-request",
    dir: "c2s",
    method: "initialize",
    kind: "request",
    caption:
      "Step 1 — the client opens with an initialize request. It carries the protocolVersion it speaks, who it is (clientInfo), and what it can do (capabilities).",
    json: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "clientInfo": {
      "name": "claude-desktop",
      "version": "0.9.4"
    },
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {}
    }
  }
}`,
  },
  {
    id: "init-response",
    dir: "s2c",
    method: "initialize",
    kind: "response",
    caption:
      "Step 2 — the server replies, paired by id. Its protocolVersion is the version it accepts; serverInfo names it; capabilities is the menu it offers.",
    json: `{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "serverInfo": {
      "name": "filesystem-server",
      "version": "1.2.0"
    },
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true },
      "prompts": {}
    }
  }
}`,
  },
  {
    id: "initialized",
    dir: "c2s",
    method: "notifications/initialized",
    kind: "notification",
    caption:
      "Step 3 — the client sends an initialized notification. No id, no reply expected: it's the client saying “I have no further question; just acknowledging your reply.” The session is open.",
    json: `{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}`,
  },
];

/** Tiny, dependency-free JSON pretty-printer. Highlights keys (terracotta-
 *  muted) and string values (default text). No second accent introduced. */
function colourJson(src: string): React.ReactNode[] {
  // Tokenise on a few cheap regexes. We trade a 100% correct lexer for a
  // legible visual; the source strings are author-controlled and small.
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const push = (node: React.ReactNode) => out.push(<span key={key++}>{node}</span>);
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"') {
      // Read a string token.
      const end = src.indexOf('"', i + 1);
      if (end === -1) {
        push(src.slice(i));
        break;
      }
      const token = src.slice(i, end + 1);
      // Heuristic: a string followed (skipping ws) by `:` is a key.
      let j = end + 1;
      while (j < src.length && /\s/.test(src[j])) j += 1;
      const isKey = src[j] === ":";
      out.push(
        <span
          key={key++}
          style={{
            color: isKey
              ? "color-mix(in oklab, var(--color-accent) 80%, var(--color-text))"
              : "var(--color-text)",
          }}
        >
          {token}
        </span>,
      );
      i = end + 1;
    } else if (/[0-9]/.test(ch)) {
      const m = /^[0-9.]+/.exec(src.slice(i));
      const len = m ? m[0].length : 1;
      out.push(
        <span key={key++} style={{ color: "var(--color-text)" }}>
          {src.slice(i, i + len)}
        </span>,
      );
      i += len;
    } else if (src.startsWith("true", i) || src.startsWith("false", i) || src.startsWith("null", i)) {
      const lit = src.startsWith("true", i)
        ? "true"
        : src.startsWith("false", i)
          ? "false"
          : "null";
      out.push(
        <span key={key++} style={{ color: "var(--color-text-muted)" }}>
          {lit}
        </span>,
      );
      i += lit.length;
    } else {
      // Punctuation / whitespace.
      out.push(
        <span key={key++} style={{ color: "var(--color-text-muted)" }}>
          {ch}
        </span>,
      );
      i += 1;
    }
  }
  return out;
}

/** Glyph for the message kind — keeps the type readable on small envelopes. */
function KindGlyph({ kind }: { kind: Step["kind"] }) {
  // request → →    response → ←    notification → ⌁ (lightning-ish)
  if (kind === "notification") {
    return (
      <span aria-hidden style={{ fontSize: 11, color: "var(--color-accent)" }}>
        ⤳
      </span>
    );
  }
  return (
    <span
      aria-hidden
      style={{
        fontSize: 11,
        color: "var(--color-accent)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {kind === "request" ? "→" : "←"}
    </span>
  );
}

export function HandshakeStepper() {
  const reduce = useReducedMotion();
  const liveRegionId = useId();

  // -1 = nothing sent yet; 0..2 = step has fired; >=3 = session ready.
  // We expose this to WidgetNav via value=`stepIndex+1`, total=4 (so the
  // four positions are: idle, after step 1, after step 2, after step 3).
  const [stepIndex, setStepIndex] = useState<number>(-1);

  const advanceTo = useCallback((next: number) => {
    setStepIndex(next);
  }, []);

  // Keyboard shortcut: ArrowRight on the canvas advances. Optional sugar.
  const canvasRef = useRef<HTMLDivElement>(null);

  const announceText = useMemo(() => {
    if (stepIndex < 0) return "Idle. No messages sent yet.";
    if (stepIndex >= STEPS.length) return "Session ready.";
    const s = STEPS[stepIndex];
    return `Step ${stepIndex + 1} of 3 — ${s.method} ${
      s.kind === "notification" ? "notification" : s.kind
    }, ${s.dir === "c2s" ? "client to server" : "server to client"}.`;
  }, [stepIndex]);

  // Replay = jump back to idle then animate from the start. We model this
  // as "set to -1" — the user advances from there.
  const handleReplay = useCallback(() => {
    playSound("Progress-Tick");
    setStepIndex(-1);
  }, []);

  const handleStep = useCallback(() => {
    playSound("Progress-Tick");
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length));
  }, []);

  const sessionReady = stepIndex >= STEPS.length;

  // Caption text — uses the *most recently fired* step's caption, or an
  // intro caption at idle, or a "session-ready" caption at the end.
  const caption = useMemo(() => {
    if (stepIndex < 0) {
      return "Press Step (or Play) to send the first message. Three messages, then the session is open.";
    }
    if (sessionReady) {
      return "Three messages exchanged. The session is open — every later request and notification rests on this negotiation.";
    }
    return STEPS[stepIndex].caption;
  }, [stepIndex, sessionReady]);

  // The currently-visible JSON in the inspector. Default to the most-recent
  // step; the inspector also lets the reader click any earlier step.
  // We derive the effective inspected step instead of mirroring it through
  // an effect — if the user-clicked step has been rewound past by Replay,
  // we transparently fall back to the latest fired step. No setState in
  // effect needed.
  const [inspected, setInspected] = useState<number | null>(null);
  const inspectedFiredAndValid =
    inspected !== null && inspected <= stepIndex && stepIndex >= 0;
  const effectiveInspected = inspectedFiredAndValid
    ? (inspected as number)
    : Math.min(Math.max(stepIndex, 0), STEPS.length - 1);

  return (
    <WidgetShell
      title="The three-message handshake — initialize → response → initialized"
      measurements={
        sessionReady
          ? "session ready"
          : stepIndex < 0
            ? "0 of 3"
            : `${stepIndex + 1} of 3`
      }
      caption={caption}
      captionTone="prominent"
      controls={
        <div
          className="flex flex-wrap items-center justify-center gap-[var(--spacing-sm)]"
        >
          <WidgetNav
            value={Math.max(stepIndex, 0)}
            total={STEPS.length}
            onChange={(next) => advanceTo(next)}
            counterNoun="message"
            playable={true}
          />
          <button
            type="button"
            onClick={handleReplay}
            className="font-sans"
            style={{
              minHeight: 36,
              padding: "6px 12px",
              border: "1px solid var(--color-rule)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-ui)",
              color: "var(--color-text-muted)",
              background: "transparent",
              cursor: "pointer",
            }}
            aria-label="Replay handshake from the start"
          >
            ↺ replay
          </button>
          <button
            type="button"
            onClick={handleStep}
            disabled={sessionReady}
            className="font-sans"
            style={{
              minHeight: 36,
              padding: "6px 12px",
              border: "1px solid var(--color-accent)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-ui)",
              color: sessionReady ? "var(--color-text-muted)" : "var(--color-accent)",
              background: sessionReady
                ? "transparent"
                : "color-mix(in oklab, var(--color-accent) 10%, transparent)",
              cursor: sessionReady ? "not-allowed" : "pointer",
              opacity: sessionReady ? 0.5 : 1,
            }}
          >
            {sessionReady ? "session ready ✓" : "step ›"}
          </button>
        </div>
      }
    >
      {/* Hidden live region for screen readers. The visible measurement
          slot already shows "N of 3" for sighted users. */}
      <div
        id={liveRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announceText}
      </div>

      <style>{`
        .bs-handshake {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }
        @container widget (min-width: 640px) {
          .bs-handshake {
            grid-template-columns: 1.4fr 1fr;
          }
        }
        .bs-handshake-lanes {
          position: relative;
          background: color-mix(in oklab, var(--color-surface) 70%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          min-height: 220px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: var(--spacing-md);
        }
        .bs-handshake-lane {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-family: var(--font-mono);
          font-size: var(--text-small);
          color: var(--color-text-muted);
        }
        .bs-handshake-lane-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: var(--color-surface);
          color: var(--color-text);
        }
        .bs-handshake-track {
          position: relative;
          height: 36px;
          margin: 0 calc(var(--spacing-md) * -0.5);
        }
        .bs-handshake-trackline {
          position: absolute;
          left: 8%;
          right: 8%;
          top: 50%;
          height: 1px;
          background: color-mix(in oklab, var(--color-text-muted) 30%, transparent);
        }
        .bs-handshake-envelope {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 12%, var(--color-surface));
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text);
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .bs-handshake-envelope[data-kind="notification"] {
          padding: 2px 8px;
          font-size: 10px;
          background: color-mix(in oklab, var(--color-accent) 8%, var(--color-surface));
          border-style: dashed;
        }
        .bs-handshake-ready {
          align-self: center;
          margin-top: var(--spacing-sm);
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 16%, transparent);
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-accent);
          letter-spacing: 0.04em;
        }
        .bs-handshake-inspector {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .bs-handshake-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-rule);
        }
        .bs-handshake-tab {
          flex: 1 1 0;
          min-height: 36px;
          padding: 8px 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text-muted);
          background: transparent;
          border: 0;
          border-right: 1px solid var(--color-rule);
          cursor: pointer;
          text-align: center;
          letter-spacing: 0.02em;
        }
        .bs-handshake-tab:last-child { border-right: 0; }
        .bs-handshake-tab[aria-current="step"] {
          color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 10%, transparent);
        }
        .bs-handshake-tab:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .bs-handshake-tab:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: -2px;
        }
        .bs-handshake-json {
          font-family: var(--font-mono);
          font-size: 12px;
          line-height: 1.55;
          padding: var(--spacing-sm) var(--spacing-md);
          margin: 0;
          white-space: pre;
          overflow-x: auto;
          color: var(--color-text);
          min-height: 180px;
        }
      `}</style>

      <div className="bs-handshake" ref={canvasRef}>
        <div className="bs-handshake-lanes">
          {/* Client lane */}
          <div className="bs-handshake-lane" aria-hidden>
            <span className="bs-handshake-lane-pill">
              <span style={{ color: "var(--color-text-muted)" }}>client</span>
              <span style={{ color: "var(--color-accent)" }}>●</span>
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              claude-desktop
            </span>
          </div>

          {/* Three tracks, one per step. Each renders the envelope at its
              start, end, or animating between, depending on stepIndex. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {STEPS.map((s, i) => {
              const fired = stepIndex >= i;
              const isLatest = stepIndex === i;
              return (
                <Track
                  key={s.id}
                  step={s}
                  fired={fired}
                  isLatest={isLatest}
                  reduce={!!reduce}
                />
              );
            })}
          </div>

          {/* Server lane */}
          <div className="bs-handshake-lane" aria-hidden>
            <span className="bs-handshake-lane-pill">
              <span style={{ color: "var(--color-text-muted)" }}>server</span>
              <span style={{ color: "var(--color-accent)" }}>●</span>
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              filesystem-server
            </span>
          </div>

          <AnimatePresence>
            {sessionReady ? (
              <motion.span
                key="ready"
                className="bs-handshake-ready"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING.gentle}
              >
                session ready
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        {/* JSON inspector. Tabs across the top let the reader click any
            already-fired step to inspect its full body. */}
        <div className="bs-handshake-inspector">
          <div className="bs-handshake-tabs" role="tablist" aria-label="Message bodies">
            {STEPS.map((s, i) => {
              const fired = stepIndex >= i;
              const active = effectiveInspected === i && fired;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  className="bs-handshake-tab"
                  aria-current={active ? "step" : undefined}
                  aria-selected={active}
                  disabled={!fired}
                  onClick={() => setInspected(i)}
                >
                  {s.method.replace("notifications/initialized", "initialized")}
                </button>
              );
            })}
          </div>
          {stepIndex < 0 ? (
            <div
              className="bs-handshake-json"
              style={{
                color: "var(--color-text-muted)",
                fontStyle: "italic",
                fontFamily: "var(--font-serif)",
                fontSize: "var(--text-small)",
                whiteSpace: "normal",
              }}
            >
              JSON appears here once a message has been sent. Click any
              fired step to inspect its body.
            </div>
          ) : (
            <pre className="bs-handshake-json" key={effectiveInspected}>
              {colourJson(STEPS[effectiveInspected].json)}
            </pre>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}

/**
 * Track — one row of the lane diagram, rendering an envelope that animates
 * from sender to receiver. Once "fired" the envelope rests at the receiver
 * end; until then the track shows a faint baseline.
 */
function Track({
  step,
  fired,
  isLatest,
  reduce,
}: {
  step: Step;
  fired: boolean;
  isLatest: boolean;
  reduce: boolean;
}) {
  // c2s = client (top, conceptually) → server (bottom). On screen, the
  // envelope translates left→right. s2c = right→left.
  const startPct = step.dir === "c2s" ? "8%" : "calc(92% - var(--env-w, 110px))";
  const endPct = step.dir === "c2s" ? "calc(92% - var(--env-w, 110px))" : "8%";

  // We animate the envelope only when it's the *latest* fired step (so the
  // page doesn't replay every step on a back-and-forth). After the latest
  // animation completes, the envelope rests at endPct.
  const restPct = endPct;

  return (
    <div className="bs-handshake-track" aria-hidden>
      <div className="bs-handshake-trackline" />
      <AnimatePresence>
        {fired ? (
          <motion.span
            key={step.id}
            className="bs-handshake-envelope"
            data-kind={step.kind}
            initial={
              reduce
                ? { left: restPct, opacity: 0 }
                : isLatest
                  ? { left: startPct, opacity: 0.4 }
                  : { left: restPct, opacity: 1 }
            }
            animate={
              reduce
                ? { left: restPct, opacity: 1 }
                : { left: restPct, opacity: 1 }
            }
            exit={{ opacity: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : isLatest
                  ? { ...SPRING.smooth }
                  : { duration: 0 }
            }
          >
            <KindGlyph kind={step.kind} />
            <span>{step.method}</span>
            {step.kind !== "notification" ? (
              <span style={{ color: "var(--color-text-muted)" }}>
                · id 1
              </span>
            ) : null}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default HandshakeStepper;
