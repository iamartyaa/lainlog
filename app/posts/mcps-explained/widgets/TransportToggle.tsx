"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

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

type Transport = "stdio" | "http";

type Pane = {
  /** Pre-rendered Shiki block. Threaded in from page.tsx (RSC). */
  node: React.ReactNode;
};

type Props = {
  panes: Record<Transport, Pane>;
};

const CAPTIONS: Record<Transport, React.ReactNode> = {
  stdio: (
    <>
      <CaptionCue>Same dance, two wires.</CaptionCue> Over stdio, every JSON
      message is one line on stdin or stdout. The client launches the server as
      a subprocess; <strong>stdout is the protocol</strong> — a stray{" "}
      <code className="font-mono">console.log</code> there will corrupt the
      session. stderr is free-form logs. Single client, dies with the parent.
    </>
  ),
  http: (
    <>
      <CaptionCue>One endpoint, both directions.</CaptionCue> POST is
      client→server; the response can be a single JSON object or an SSE stream.
      GET opens a server→client SSE channel. The{" "}
      <code className="font-mono">Mcp-Session-Id</code> header pins the session;
      lose it and the server returns 404. Reconnect with{" "}
      <code className="font-mono">Last-Event-ID</code> to replay missed
      messages.
    </>
  ),
};

const MEASUREMENT: Record<Transport, string> = {
  stdio: "subprocess · newline-delimited",
  http: "one endpoint · sessioned",
};

/**
 * TransportToggle (§6) — segmented control over two pre-rendered Shiki
 * panes. Same `initialize` exchange, two wire formats. The frame stays the
 * same size on toggle (R6); only the contents fade in/out.
 *
 * The two snippets are pre-rendered through `<CodeBlock>` in page.tsx and
 * threaded in via the `panes` prop — keeps the client bundle small.
 *
 * Audio: `Radio` on segmented control change (Tier-1 per audio playbook —
 * Radio is the canonical "segmented selection" sound, see ParseVsRender).
 *
 * Accessibility: tabs are real `role="tab"` / `aria-selected` pair; the
 * pane is a single region beneath. Hit targets are ≥ 44 × 44.
 */
export function TransportToggle({ panes }: Props) {
  const [transport, setTransport] = useState<Transport>("stdio");

  return (
    <WidgetShell
      title="two transports · one protocol"
      measurements={MEASUREMENT[transport]}
      captionTone="prominent"
      caption={CAPTIONS[transport]}
      controls={
        <div
          role="tablist"
          aria-label="MCP transport"
          className="inline-flex rounded-[var(--radius-sm)] font-sans"
          style={{
            fontSize: "var(--text-ui)",
            border: "1px solid var(--color-rule)",
            overflow: "hidden",
          }}
        >
          {(["stdio", "http"] as Transport[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={transport === t}
              onClick={() => {
                if (transport !== t) playSound("Radio");
                setTransport(t);
              }}
              className="px-[var(--spacing-md)] py-[var(--spacing-2xs)] min-h-[44px] transition-colors"
              style={{
                background:
                  transport === t
                    ? "color-mix(in oklab, var(--color-accent) 20%, transparent)"
                    : "transparent",
                color:
                  transport === t
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                fontWeight: transport === t ? 600 : 500,
                minWidth: 96,
              }}
            >
              {t === "stdio" ? "stdio" : "Streamable HTTP"}
            </button>
          ))}
        </div>
      }
    >
      <div className="relative" style={{ minHeight: 320 }}>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={transport}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING.smooth}
          >
            {panes[transport].node}
          </motion.div>
        </AnimatePresence>
      </div>
    </WidgetShell>
  );
}
