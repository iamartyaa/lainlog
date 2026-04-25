"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Stepper } from "@/components/viz/Stepper";
import { PRESS, SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type Step = {
  id: string;
  label: string;
  caption: (allow: boolean) => string;
};

const STEPS: Step[] = [
  {
    id: "idle",
    label: "idle",
    caption: () =>
      "Press ▸ to walk a cross-origin fetch from the browser to the server and back. Toggle the allow-origin header to compare verdicts.",
  },
  {
    id: "issue",
    label: "fetch() issued",
    caption: () =>
      "JS calls fetch. The request is now in the browser's hands — JS has let go until a Promise resolves or rejects.",
  },
  {
    id: "inflight",
    label: "request in flight",
    caption: () =>
      "The browser opens a socket, TLS-handshakes, and sends the HTTP request over the wire. The Origin header tags it as cross-origin.",
  },
  {
    id: "handled",
    label: "server handles",
    caption: () =>
      "The server runs its handler. It reads cookies, writes to the database, whatever — the handler has no idea this is a cross-origin call and doesn't need to.",
  },
  {
    id: "responded",
    label: "response 200 + body",
    caption: () =>
      "The server sends back a normal HTTP response. 200 OK, a real body, the real headers. The network succeeded.",
  },
  {
    id: "decided",
    label: "browser decides",
    caption: (allow) =>
      allow
        ? "The browser reads the response headers, sees Access-Control-Allow-Origin matching the page's origin, and resolves the Promise with a readable Response. JS can now read the body."
        : "The browser reads the response headers, looks for an Access-Control-Allow-Origin matching the page's origin, doesn't find one, and silently discards the body. JS sees only TypeError: Failed to fetch.",
  },
];

const LANE_LABELS = ["JS", "browser", "network", "server"] as const;

type Actor = 0 | 1 | 2 | 3;

type Message = {
  /** Earliest step at which this message is visible. */
  from: number;
  /** Lifelines: 0 = JS, 1 = browser, 2 = network, 3 = server */
  fromCol: Actor;
  toCol: Actor;
  label: string;
  shortLabel?: string;
  tone?: "default" | "accent" | "muted";
};

const MESSAGES: Message[] = [
  {
    from: 1,
    fromCol: 0,
    toCol: 1,
    label: "fetch(url)",
    shortLabel: "fetch",
  },
  {
    from: 2,
    fromCol: 1,
    toCol: 3,
    label: "GET /me · Origin: app.example.com",
    shortLabel: "GET /me",
  },
  {
    from: 3,
    fromCol: 3,
    toCol: 3,
    label: "handler runs",
    shortLabel: "handler",
    tone: "muted",
  },
  {
    from: 4,
    fromCol: 3,
    toCol: 1,
    label: "200 OK · body",
    shortLabel: "200 OK",
  },
  {
    from: 5,
    fromCol: 1,
    toCol: 0,
    label: "verdict (allow-origin?)",
    shortLabel: "verdict",
    tone: "accent",
  },
];

type Props = {
  initialStep?: number;
  initialAllowOrigin?: boolean;
};

export function RequestJourney({
  initialStep = 0,
  initialAllowOrigin = false,
}: Props) {
  const [step, setStep] = useState(initialStep);
  const [allow, setAllow] = useState(initialAllowOrigin);

  const current = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <WidgetShell
      title="request journey · the browser is the gatekeeper"
      measurements={`step ${step + 1}/${STEPS.length} · allow-origin ${allow ? "sent" : "missing"}`}
      captionTone="prominent"
      caption={current.caption(allow)}
      controls={
        <div className="flex items-center gap-[var(--spacing-md)] flex-wrap">
          <Stepper value={step} total={STEPS.length} onChange={setStep} />
          <motion.button
            type="button"
            onClick={() => setAllow((v) => !v)}
            aria-pressed={allow}
            aria-label="Toggle the Access-Control-Allow-Origin header"
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center font-mono transition-colors"
            style={{
              fontSize: "var(--text-small)",
              color: allow ? "var(--color-bg)" : "var(--color-text)",
              background: allow ? "var(--color-accent)" : "transparent",
              border: `1px solid ${allow ? "var(--color-accent)" : "var(--color-rule)"}`,
            }}
            {...PRESS}
          >
            Access-Control-Allow-Origin: {allow ? "app.example.com" : "missing"}
          </motion.button>
        </div>
      }
    >
      <Journey step={step} allow={allow} current={current} />
    </WidgetShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Single mobile-first canvas — horizontal lifelines, time flows L→R.        */
/*  Authoring viewport is ~340 units wide; SVG scales up via width:100% +     */
/*  viewBox. Replaces the prior wide/narrow dual-render trick.                */
/* -------------------------------------------------------------------------- */

function Journey({
  step,
  allow,
  current,
}: {
  step: number;
  allow: boolean;
  current: Step;
}) {
  const WIDTH = 340;
  const LEFT_PAD = 52;
  const RIGHT_PAD = 14;
  const TOP_PAD = 22;
  const ROW_H = 38;
  const ROWS = 4;
  const LIFELINE_BOT = TOP_PAD + ROWS * ROW_H;
  const LABEL_BAND = 48;
  const DEVTOOLS_H = 60;
  const HEIGHT = LIFELINE_BOT + LABEL_BAND + DEVTOOLS_H + 14;
  const rowY = (i: number) => TOP_PAD + i * ROW_H + ROW_H / 2;

  const timelineW = WIDTH - LEFT_PAD - RIGHT_PAD;
  const msgX = (i: number) =>
    LEFT_PAD +
    20 +
    (i * (timelineW - 32)) / Math.max(MESSAGES.length - 1, 1);

  const lastX = msgX(MESSAGES.length - 1);
  const showDiscard = step >= 5 && !allow;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{ height: "auto", display: "block" }}
      role="img"
      aria-label={`Request journey step ${step + 1}: ${current.label}`}
    >
      <defs>
        <marker
          id="arrow-default-rj"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-text-muted)" />
        </marker>
        <marker
          id="arrow-accent-rj"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-accent)" />
        </marker>
      </defs>

      {/* Actor rows: label on left + horizontal dashed lifeline */}
      {LANE_LABELS.map((lane, i) => (
        <g key={lane}>
          <text
            x={LEFT_PAD - 8}
            y={rowY(i)}
            textAnchor="end"
            dominantBaseline="central"
            fontFamily="var(--font-sans)"
            fontSize={11}
            fontWeight={500}
            fill="var(--color-text-muted)"
          >
            {lane}
          </text>
          <line
            x1={LEFT_PAD}
            x2={WIDTH - RIGHT_PAD}
            y1={rowY(i)}
            y2={rowY(i)}
            stroke="var(--color-rule)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        </g>
      ))}

      {/* Time axis label */}
      <text
        x={LEFT_PAD}
        y={TOP_PAD - 8}
        fontFamily="var(--font-sans)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        time →
      </text>

      {/* Browser ↔ JS boundary band — at the last message column when the
          request reaches the verdict step. */}
      {(() => {
        const gateActive = step >= 5;
        const y0 = rowY(0);
        const y1 = rowY(1);
        return (
          <motion.g
            initial={false}
            animate={{ opacity: step >= 4 ? 1 : 0.3 }}
            transition={SPRING.smooth}
          >
            <rect
              x={lastX - 20}
              y={y0 - 8}
              width={40}
              height={y1 - y0 + 16}
              rx={3}
              fill={
                gateActive
                  ? allow
                    ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                    : "color-mix(in oklab, var(--color-accent) 10%, transparent)"
                  : "transparent"
              }
              stroke={gateActive ? "var(--color-accent)" : "var(--color-rule)"}
              strokeWidth={gateActive ? 1.4 : 1}
              strokeDasharray={gateActive ? undefined : "3 3"}
            />
          </motion.g>
        );
      })()}

      {/* Messages as vertical arrows at their time-step column */}
      {MESSAGES.map((m, idx) => {
        const x = msgX(idx);
        const visible = step >= m.from;
        const isCurrent = step === m.from;
        const past = step > m.from;

        const tone =
          m.tone === "accent"
            ? "var(--color-accent)"
            : m.tone === "muted"
              ? "var(--color-text-muted)"
              : isCurrent
                ? "var(--color-accent)"
                : "var(--color-text-muted)";
        const arrowMarker =
          m.tone === "accent"
            ? "url(#arrow-accent-rj)"
            : "url(#arrow-default-rj)";
        const token = m.shortLabel ?? m.label;
        const isSelf = m.fromCol === m.toCol;

        return (
          <motion.g
            key={`m-${idx}`}
            initial={false}
            animate={{
              opacity: visible ? (isCurrent ? 1 : past ? 0.6 : 0) : 0,
            }}
            transition={SPRING.smooth}
          >
            {isSelf ? (
              <path
                d={`M ${x - 2} ${rowY(m.fromCol) - 8}
                    q -12 0 -12 8
                    q 0 8 12 8`}
                fill="none"
                stroke={tone}
                strokeWidth={isCurrent ? 1.6 : 1}
                markerEnd={arrowMarker}
              />
            ) : (
              <line
                x1={x}
                x2={x}
                y1={rowY(m.fromCol)}
                y2={rowY(m.toCol)}
                stroke={tone}
                strokeWidth={isCurrent ? 1.8 : 1}
                markerEnd={arrowMarker}
              />
            )}
            {/* Short token above the topmost point of the arrow */}
            <text
              x={x}
              y={Math.min(rowY(m.fromCol), rowY(m.toCol)) - 6}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill={isCurrent ? "var(--color-text)" : "var(--color-text-muted)"}
            >
              {token}
            </text>
          </motion.g>
        );
      })}

      {/* Full current-message label below the lifelines where it has room */}
      <motion.text
        key={`label-${step}-${allow ? "a" : "b"}`}
        x={WIDTH / 2}
        y={LIFELINE_BOT + 22}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={11}
        fill="var(--color-text)"
        initial={{ opacity: 0, y: LIFELINE_BOT + 28 }}
        animate={{ opacity: 1, y: LIFELINE_BOT + 22 }}
        transition={SPRING.smooth}
      >
        {step === 5
          ? allow
            ? "resolve(Response)"
            : "TypeError: Failed to fetch"
          : MESSAGES[Math.min(step, MESSAGES.length - 1)]?.label ?? ""}
      </motion.text>

      {/* Compact DevTools panel */}
      <g>
        <rect
          x={LEFT_PAD}
          y={HEIGHT - DEVTOOLS_H - 4}
          width={WIDTH - LEFT_PAD - RIGHT_PAD}
          height={DEVTOOLS_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 60%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={LEFT_PAD + 8}
          y={HEIGHT - DEVTOOLS_H + 14}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="var(--color-text-muted)"
        >
          DevTools
        </text>

        {/* Network row — `body` is what gets discarded on allow=false */}
        <motion.g
          initial={false}
          animate={{ opacity: step >= 4 ? 1 : 0.25 }}
          transition={SPRING.smooth}
        >
          <text
            x={LEFT_PAD + 8}
            y={HEIGHT - DEVTOOLS_H + 30}
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill="var(--color-text)"
          >
            Net · 200 OK · body
          </text>
          {/* Discard beat — terracotta strikethrough across "body" when verdict is
              fail. scaleX animates 0→1, transform-only per DESIGN §9. */}
          <motion.rect
            x={LEFT_PAD + 8}
            y={HEIGHT - DEVTOOLS_H + 26}
            width={120}
            height={1.5}
            fill="var(--color-accent)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: showDiscard ? 1 : 0 }}
            transition={SPRING.smooth}
            style={{ transformOrigin: `${LEFT_PAD + 8}px ${HEIGHT - DEVTOOLS_H + 26}px` }}
          />
        </motion.g>

        <motion.text
          x={LEFT_PAD + 8}
          y={HEIGHT - DEVTOOLS_H + 46}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill={allow ? "var(--color-text-muted)" : "var(--color-accent)"}
          initial={false}
          animate={{ opacity: step >= 5 ? 1 : 0.25 }}
          transition={SPRING.smooth}
        >
          {allow ? "▸ Response {…}" : "✗ TypeError"}
        </motion.text>
      </g>
    </svg>
  );
}
