"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

function CaptionCue({ children }: { children: React.ReactNode }) {
  return (
    <TextHighlighter
      triggerType="auto"
      transition={HL_TX}
      highlightColor={HL_COLOR}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

/* ---------------------------------------------------------------------------
 * §3 widget — scripted stepper through the three messages of every MCP
 * session. Two stylised JSON panes (client | server). Each step illuminates
 * one line range in the active pane and surfaces a chip annotation on the
 * relevant side. The frame stays the same size step-to-step (R6); the line
 * highlight is an absolutely-positioned overlay.
 *
 * One verb: step (via WidgetNav).
 *
 * The JSON shown here is a stylised summary, not bytes-on-wire. The full
 * envelopes live in `snippets.ts` and ship through page.tsx (Shiki). This
 * widget's job is to visualise the dance, not to render the bytes.
 * --------------------------------------------------------------------------*/

const CLIENT_LINES = [
  `// Client → Server`,
  `{`,
  `  "method": "initialize",`,
  `  "params": {`,
  `    "protocolVersion": "2025-06-18",`,
  `    "capabilities": {`,
  `      "roots": { "listChanged": true },`,
  `      "sampling": {},`,
  `      "elicitation": {}`,
  `    },`,
  `    "clientInfo": { "name": "Cli", "version": "1.0.0" }`,
  `  }`,
  `}`,
  ``,
  `// Client → Server (notification)`,
  `{`,
  `  "method": "notifications/initialized"`,
  `}`,
];

const SERVER_LINES = [
  `// Server → Client (response)`,
  `{`,
  `  "id": 1,`,
  `  "result": {`,
  `    "protocolVersion": "2025-06-18",`,
  `    "capabilities": {`,
  `      "tools": { "listChanged": true },`,
  `      "resources": { "subscribe": true },`,
  `      "prompts": {}`,
  `    },`,
  `    "serverInfo": { "name": "fs", "version": "0.4.2" },`,
  `    "instructions": "Files exposed under roots."`,
  `  }`,
  `}`,
];

type Step = {
  label: string;
  clientActive: number[];
  serverActive: number[];
  clientChip: string | null;
  serverChip: string | null;
  caption: React.ReactNode;
};

const STEPS: Step[] = [
  {
    label: "idle",
    clientActive: [],
    serverActive: [],
    clientChip: "ready",
    serverChip: "ready",
    caption: (
      <>
        <CaptionCue>Both sides are silent.</CaptionCue> The client just opened a
        pipe to the server. Until the handshake completes, neither may send
        anything but ping or logging.
      </>
    ),
  },
  {
    label: "init · req",
    clientActive: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    serverActive: [],
    clientChip: "→ initialize",
    serverChip: "reading",
    caption: (
      <>
        <CaptionCue>Step 1 — the request.</CaptionCue> The client declares its
        protocol version and the capabilities it supports. Note that{" "}
        <code className="font-mono">tools</code> is{" "}
        <em>absent</em>: clients don&apos;t expose tools, only servers do. The
        client is offering <code className="font-mono">roots</code>,{" "}
        <code className="font-mono">sampling</code>, and{" "}
        <code className="font-mono">elicitation</code>.
      </>
    ),
  },
  {
    label: "init · res",
    clientActive: [],
    serverActive: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    clientChip: "reading",
    serverChip: "← capabilities",
    caption: (
      <>
        <CaptionCue>Step 2 — the contract.</CaptionCue> The server replies with
        what <em>it</em> supports — three primitives in this case:{" "}
        <code className="font-mono">tools</code>,{" "}
        <code className="font-mono">resources</code>, and{" "}
        <code className="font-mono">prompts</code>. The session is now pinned to
        the intersection. No surprises later.
      </>
    ),
  },
  {
    label: "ready",
    clientActive: [14, 15, 16, 17],
    serverActive: [],
    clientChip: "→ initialized",
    serverChip: "open",
    caption: (
      <>
        <CaptionCue>Step 3 — the green light.</CaptionCue> The client confirms
        with a one-way <code className="font-mono">notifications/initialized</code>
        . No <code className="font-mono">id</code>, no response expected. From
        this point on, every <code className="font-mono">tools/list</code>,{" "}
        <code className="font-mono">tools/call</code>,{" "}
        <code className="font-mono">resources/read</code>, and{" "}
        <code className="font-mono">sampling/createMessage</code> is just
        JSON-RPC riding the same connection.
      </>
    ),
  },
];

function CodePane({
  title,
  lines,
  active,
  chip,
}: {
  title: string;
  lines: string[];
  active: number[];
  chip: string | null;
}) {
  const LINE_H = 18;
  const PADDING = 10;
  const reservedLines = Math.max(CLIENT_LINES.length, SERVER_LINES.length);
  const minH = reservedLines * LINE_H + PADDING * 2;
  const isProto = chip ? /initialize|capabilities|initialized/i.test(chip) : false;
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="flex items-center justify-between"
        style={{
          fontSize: "var(--text-ui)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="font-sans">{title}</span>
        <AnimatePresence mode="wait" initial={false}>
          {chip ? (
            <motion.span
              key={chip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING.snappy}
              className="font-mono"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 3,
                background: isProto ? "var(--color-accent)" : "transparent",
                color: isProto
                  ? "var(--color-bg)"
                  : "var(--color-text-muted)",
                border: isProto ? "none" : "1px solid var(--color-rule)",
              }}
            >
              {chip}
            </motion.span>
          ) : (
            <span style={{ visibility: "hidden", fontSize: 11 }}>·</span>
          )}
        </AnimatePresence>
      </div>
      <div
        className="relative font-mono"
        style={{
          background:
            "color-mix(in oklab, var(--color-surface) 60%, transparent)",
          padding: PADDING,
          borderRadius: "var(--radius-sm)",
          minHeight: minH,
          fontSize: 11,
          lineHeight: `${LINE_H}px`,
          color: "var(--color-text)",
          overflowX: "auto",
        }}
      >
        {lines.map((line, i) => {
          const isActive = active.includes(i);
          return (
            <div key={i} style={{ position: "relative", paddingLeft: 4 }}>
              {isActive ? (
                <motion.span
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={SPRING.snappy}
                  style={{
                    position: "absolute",
                    inset: `0 -6px 0 -6px`,
                    background:
                      "color-mix(in oklab, var(--color-accent) 18%, transparent)",
                    borderRadius: 2,
                    pointerEvents: "none",
                  }}
                />
              ) : null}
              <span
                style={{
                  position: "relative",
                  color: isActive
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                  whiteSpace: "pre",
                }}
              >
                {line || " "}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MemoCodePane = memo(CodePane);

/**
 * HandshakeWalkthrough (§3) — the three-message dance, walked tick-by-tick.
 *
 * One verb: step (via WidgetNav).
 *
 * Frame stability (R6): both panes have a fixed `min-height` set to the
 * longest variant. Line highlight is an absolutely-positioned overlay;
 * nothing reflows.
 *
 * Mobile-first: panes stack on narrow containers; flip side-by-side at the
 * `widget` container query 600 px breakpoint. Audio: WidgetNav already
 * fires `Progress-Tick` per step (Tier-1, audio playbook).
 */
export function HandshakeWalkthrough() {
  const [step, setStep] = useState(0);
  const tick = STEPS[step];

  return (
    <WidgetShell
      title="initialize · capabilities · initialized"
      measurements={`${step} / 3`}
      caption={tick.caption}
      captionTone="prominent"
      controls={
        <div className="flex items-center justify-center w-full">
          <WidgetNav
            value={step}
            total={STEPS.length}
            onChange={setStep}
            counterNoun="step"
          />
        </div>
      }
    >
      <div
        className="grid gap-[var(--spacing-md)]"
        style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
      >
        <div className="bs-handshake-grid">
          <MemoCodePane
            title="client"
            lines={CLIENT_LINES}
            active={tick.clientActive}
            chip={tick.clientChip}
          />
          <MemoCodePane
            title="server"
            lines={SERVER_LINES}
            active={tick.serverActive}
            chip={tick.serverChip}
          />
        </div>
        <style>{`
          .bs-handshake-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }
          @container widget (min-width: 600px) {
            .bs-handshake-grid {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </div>
    </WidgetShell>
  );
}
