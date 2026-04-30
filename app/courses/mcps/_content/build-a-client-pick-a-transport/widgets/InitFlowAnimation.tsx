"use client";

/**
 * InitFlowAnimation — six-step scripted stepper for chapter 7.
 *
 * Extends the visual grammar of chapter 4's HandshakeStepper to six
 * messages, covering the full client-driven exchange the reader's own
 * minimal client kicks off:
 *   1. connect                     — transport open (no JSON-RPC yet)
 *   2. initialize request          — c2s
 *   3. initialize response         — s2c
 *   4. notifications/initialized   — c2s, no reply
 *   5. tools/list request          — c2s
 *   6. tools/list response         — s2c
 *
 * After step 6, a "tools loaded" badge appears so the reader feels the
 * payoff: this is the moment `await client.listTools()` resolves and the
 * host has a real menu to render. Replay rewinds to idle. WidgetNav drives
 * the step cursor; clicking a tab in the JSON inspector also jumps to that
 * step.
 *
 * Decisions baked in:
 * - Two horizontal "lanes" (client and server) at >= 480px container
 *   width; lanes stack on phones.
 * - Envelopes are small terracotta-bordered chips that translate from
 *   sender to receiver. Reduced motion drops the translation — envelopes
 *   appear at end positions instantly. Frame size identical either way.
 * - Step 1 (`connect`) renders a thin "transport open" pill in both
 *   lanes rather than a moving envelope — the connection is bidirectional
 *   from there on, so there's no envelope to send.
 * - One accent only — terracotta on envelope borders + active step
 *   indicator. No second hue.
 * - JSON inspector to the right of the lanes (or below, on phones):
 *   every step reveals its body, syntax-coloured via plain spans.
 * - aria-live announces "step N of 6 — <method>" on each advance.
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

type Direction = "c2s" | "s2c" | "both";
type Kind = "transport" | "request" | "response" | "notification";

type Step = {
  id: string;
  dir: Direction;
  method: string;
  kind: Kind;
  caption: string;
  json: string;
};

const STEPS: Step[] = [
  {
    id: "connect",
    dir: "both",
    method: "connect",
    kind: "transport",
    caption:
      "Step 1 — the client opens the transport. With stdio that's a child-process spawn; with Streamable HTTP it's the first POST. No JSON-RPC body yet — just a wire.",
    json: `// no JSON-RPC body — the transport is open
// stdio:        spawn({ command, args })
// Streamable HTTP:  POST <url>  (with optional Authorization)`,
  },
  {
    id: "init-request",
    dir: "c2s",
    method: "initialize",
    kind: "request",
    caption:
      "Step 2 — the client sends initialize. It carries the protocolVersion it speaks, who it is (clientInfo), and what it can do (capabilities).",
    json: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "clientInfo": {
      "name": "minimal-client",
      "version": "0.1.0"
    },
    "capabilities": {}
  }
}`,
  },
  {
    id: "init-response",
    dir: "s2c",
    method: "initialize",
    kind: "response",
    caption:
      "Step 3 — the server replies, paired by id. It declares its serverInfo and the menu of capabilities it offers — tools, resources, prompts, logging.",
    json: `{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "serverInfo": {
      "name": "currency-server",
      "version": "1.0.0"
    },
    "capabilities": {
      "tools": { "listChanged": true }
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
      "Step 4 — the client sends an initialized notification. No id, no reply expected: the session is open. Past this gate, every other request is fair game.",
    json: `{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}`,
  },
  {
    id: "tools-list-request",
    dir: "c2s",
    method: "tools/list",
    kind: "request",
    caption:
      "Step 5 — the client asks for the tool catalogue. This is the first message your minimal client sends after connect() resolves; it's what await client.listTools() does on the wire.",
    json: `{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}`,
  },
  {
    id: "tools-list-response",
    dir: "s2c",
    method: "tools/list",
    kind: "response",
    caption:
      "Step 6 — the server returns the catalogue. Each tool has a name, a one-line description, and a JSON-schema input. The host now has a menu to render to the model.",
    json: `{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "convert",
        "description": "Convert between currencies",
        "inputSchema": {
          "type": "object",
          "properties": {
            "amount": { "type": "number" },
            "from": { "type": "string" },
            "to": { "type": "string" }
          },
          "required": ["amount", "from", "to"]
        }
      }
    ]
  }
}`,
  },
];

/** Tiny JSON pretty-printer. Matches the HandshakeStepper colouring rules. */
function colourJson(src: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < src.length) {
    const ch = src[i];
    // Line comments — used only by the connect step's stub body.
    if (ch === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      out.push(
        <span
          key={key++}
          style={{
            color: "var(--color-text-muted)",
            fontStyle: "italic",
          }}
        >
          {src.slice(i, stop)}
        </span>,
      );
      i = stop;
      continue;
    }
    if (ch === '"') {
      const end = src.indexOf('"', i + 1);
      if (end === -1) {
        out.push(<span key={key++}>{src.slice(i)}</span>);
        break;
      }
      const token = src.slice(i, end + 1);
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
    } else if (
      src.startsWith("true", i) ||
      src.startsWith("false", i) ||
      src.startsWith("null", i)
    ) {
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

function KindGlyph({ kind }: { kind: Kind }) {
  if (kind === "transport") {
    return (
      <span
        aria-hidden
        style={{
          fontSize: 11,
          color: "var(--color-accent)",
          fontFamily: "var(--font-mono)",
        }}
      >
        ⇌
      </span>
    );
  }
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

export function InitFlowAnimation() {
  const reduce = useReducedMotion();
  const liveRegionId = useId();

  // -1 = nothing fired; 0..5 = step has fired; >=6 = tools loaded.
  const [stepIndex, setStepIndex] = useState<number>(-1);

  const advanceTo = useCallback((next: number) => {
    setStepIndex(next);
  }, []);

  const canvasRef = useRef<HTMLDivElement>(null);

  const announceText = useMemo(() => {
    if (stepIndex < 0) return "Idle. No messages sent yet.";
    if (stepIndex >= STEPS.length) return "Tools loaded. Ready to call.";
    const s = STEPS[stepIndex];
    return `Step ${stepIndex + 1} of ${STEPS.length} — ${s.method} ${
      s.kind === "transport"
        ? "transport"
        : s.kind === "notification"
          ? "notification"
          : s.kind
    }${s.dir === "both" ? "" : s.dir === "c2s" ? ", client to server" : ", server to client"}.`;
  }, [stepIndex]);

  const handleReplay = useCallback(() => {
    playSound("Progress-Tick");
    setStepIndex(-1);
  }, []);

  const handleStep = useCallback(() => {
    playSound("Progress-Tick");
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length));
  }, []);

  const ready = stepIndex >= STEPS.length;

  const caption = useMemo(() => {
    if (stepIndex < 0) {
      return "Press Step (or Play) to send the first message. Six messages, then the tool catalogue is in hand.";
    }
    if (ready) {
      return "Six messages exchanged. The session is open and the tool catalogue is loaded — your minimal client now has a menu to call into.";
    }
    return STEPS[stepIndex].caption;
  }, [stepIndex, ready]);

  const [inspected, setInspected] = useState<number | null>(null);
  const inspectedFiredAndValid =
    inspected !== null && inspected <= stepIndex && stepIndex >= 0;
  const effectiveInspected = inspectedFiredAndValid
    ? (inspected as number)
    : Math.min(Math.max(stepIndex, 0), STEPS.length - 1);

  return (
    <WidgetShell
      title="The init flow — connect through tools/list"
      measurements={
        ready
          ? "tools loaded"
          : stepIndex < 0
            ? `0 of ${STEPS.length}`
            : `${stepIndex + 1} of ${STEPS.length}`
      }
      caption={caption}
      captionTone="prominent"
      controls={
        <div className="flex flex-wrap items-center justify-center gap-[var(--spacing-sm)]">
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
            aria-label="Replay init flow from the start"
          >
            ↺ replay
          </button>
          <button
            type="button"
            onClick={handleStep}
            disabled={ready}
            className="font-sans"
            style={{
              minHeight: 36,
              padding: "6px 12px",
              border: "1px solid var(--color-accent)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-ui)",
              color: ready ? "var(--color-text-muted)" : "var(--color-accent)",
              background: ready
                ? "transparent"
                : "color-mix(in oklab, var(--color-accent) 10%, transparent)",
              cursor: ready ? "not-allowed" : "pointer",
              opacity: ready ? 0.5 : 1,
            }}
          >
            {ready ? "tools loaded ✓" : "step ›"}
          </button>
        </div>
      }
    >
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
        .bs-init {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }
        @container widget (min-width: 640px) {
          .bs-init {
            grid-template-columns: 1.4fr 1fr;
          }
        }
        .bs-init-lanes {
          position: relative;
          background: color-mix(in oklab, var(--color-surface) 70%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          min-height: 320px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: var(--spacing-sm);
        }
        .bs-init-lane {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-family: var(--font-mono);
          font-size: var(--text-small);
          color: var(--color-text-muted);
        }
        .bs-init-lane-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: var(--color-surface);
          color: var(--color-text);
        }
        .bs-init-tracks {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bs-init-track {
          position: relative;
          height: 32px;
          margin: 0 calc(var(--spacing-md) * -0.5);
        }
        .bs-init-trackline {
          position: absolute;
          left: 8%;
          right: 8%;
          top: 50%;
          height: 1px;
          background: color-mix(in oklab, var(--color-text-muted) 30%, transparent);
        }
        .bs-init-envelope {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          padding: 3px 9px;
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
        .bs-init-envelope[data-kind="notification"] {
          padding: 2px 7px;
          font-size: 10px;
          background: color-mix(in oklab, var(--color-accent) 8%, var(--color-surface));
          border-style: dashed;
        }
        .bs-init-envelope[data-kind="transport"] {
          left: 50% !important;
          transform: translate(-50%, -50%);
          background: transparent;
          border-style: dotted;
          color: var(--color-text-muted);
        }
        .bs-init-ready {
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
        .bs-init-inspector {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .bs-init-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-rule);
          overflow-x: auto;
        }
        .bs-init-tab {
          flex: 1 0 auto;
          min-height: 36px;
          padding: 8px 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-text-muted);
          background: transparent;
          border: 0;
          border-right: 1px solid var(--color-rule);
          cursor: pointer;
          text-align: center;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .bs-init-tab:last-child { border-right: 0; }
        .bs-init-tab[aria-current="step"] {
          color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 10%, transparent);
        }
        .bs-init-tab:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .bs-init-tab:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: -2px;
        }
        .bs-init-json {
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1.55;
          padding: var(--spacing-sm) var(--spacing-md);
          margin: 0;
          white-space: pre;
          overflow-x: auto;
          color: var(--color-text);
          min-height: 220px;
        }
      `}</style>

      <div className="bs-init" ref={canvasRef}>
        <div className="bs-init-lanes">
          <div className="bs-init-lane" aria-hidden>
            <span className="bs-init-lane-pill">
              <span style={{ color: "var(--color-text-muted)" }}>client</span>
              <span style={{ color: "var(--color-accent)" }}>●</span>
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              minimal-client
            </span>
          </div>

          <div className="bs-init-tracks">
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

          <div className="bs-init-lane" aria-hidden>
            <span className="bs-init-lane-pill">
              <span style={{ color: "var(--color-text-muted)" }}>server</span>
              <span style={{ color: "var(--color-accent)" }}>●</span>
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              currency-server
            </span>
          </div>

          <AnimatePresence>
            {ready ? (
              <motion.span
                key="ready"
                className="bs-init-ready"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING.gentle}
              >
                tools loaded
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="bs-init-inspector">
          <div
            className="bs-init-tabs"
            role="tablist"
            aria-label="Message bodies"
          >
            {STEPS.map((s, i) => {
              const fired = stepIndex >= i;
              const active = effectiveInspected === i && fired;
              const tabLabel =
                s.method === "notifications/initialized"
                  ? "initialized"
                  : s.method;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  className="bs-init-tab"
                  aria-current={active ? "step" : undefined}
                  aria-selected={active}
                  disabled={!fired}
                  onClick={() => setInspected(i)}
                >
                  {i + 1}. {tabLabel}
                </button>
              );
            })}
          </div>
          {stepIndex < 0 ? (
            <div
              className="bs-init-json"
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
            <pre className="bs-init-json" key={effectiveInspected}>
              {colourJson(STEPS[effectiveInspected].json)}
            </pre>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}

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
  // c2s: left → right; s2c: right → left; transport: stays centred.
  const startPct =
    step.dir === "c2s"
      ? "8%"
      : step.dir === "s2c"
        ? "calc(92% - var(--env-w, 110px))"
        : "50%";
  const endPct =
    step.dir === "c2s"
      ? "calc(92% - var(--env-w, 110px))"
      : step.dir === "s2c"
        ? "8%"
        : "50%";

  const restPct = endPct;

  return (
    <div className="bs-init-track" aria-hidden>
      <div className="bs-init-trackline" />
      <AnimatePresence>
        {fired ? (
          <motion.span
            key={step.id}
            className="bs-init-envelope"
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
            <span>
              {step.method === "notifications/initialized"
                ? "initialized"
                : step.method}
            </span>
            {step.kind === "request" || step.kind === "response" ? (
              <span style={{ color: "var(--color-text-muted)" }}>
                · id {step.id.includes("init") ? 1 : 2}
              </span>
            ) : null}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default InitFlowAnimation;
