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
      "Nothing has happened yet. JS is about to call fetch on a cross-origin URL.",
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

type Message = {
  /** Earliest step at which this message is visible. */
  from: number;
  /** Step at which this message becomes "past" (dimmed). */
  through?: number;
  /** Lifelines: 0 = JS, 1 = browser, 2 = network, 3 = server */
  fromCol: 0 | 1 | 2 | 3;
  toCol: 0 | 1 | 2 | 3;
  y: number;
  label: string;
  tone?: "default" | "accent" | "muted";
};

type Props = {
  initialStep?: number;
  initialAllowOrigin?: boolean;
};

export function RequestJourney({
  initialStep = 5,
  initialAllowOrigin = false,
}: Props) {
  const [step, setStep] = useState(initialStep);
  const [allow, setAllow] = useState(initialAllowOrigin);

  const current = STEPS[Math.min(step, STEPS.length - 1)];

  const WIDTH = 820;
  const HEIGHT = 380;
  const LEFT_PAD = 64;
  const RIGHT_PAD = 32;
  const TOP = 40;
  const BOT = 260;
  const COLS = 4;
  const colX = (i: number) =>
    LEFT_PAD + (i * (WIDTH - LEFT_PAD - RIGHT_PAD)) / (COLS - 1);

  const messages: Message[] = [
    {
      from: 1,
      fromCol: 0,
      toCol: 1,
      y: TOP + 22,
      label: "fetch(url)",
    },
    {
      from: 2,
      fromCol: 1,
      toCol: 3,
      y: TOP + 62,
      label: "GET /me · Origin: app.example.com",
    },
    {
      from: 3,
      fromCol: 3,
      toCol: 3,
      y: TOP + 102,
      label: "handler runs",
      tone: "muted",
    },
    {
      from: 4,
      fromCol: 3,
      toCol: 1,
      y: TOP + 142,
      label: "200 OK · body",
    },
    {
      from: 5,
      fromCol: 1,
      toCol: 0,
      y: TOP + 200,
      label: allow ? "resolve(Response)" : "TypeError",
      tone: allow ? "accent" : "accent",
    },
  ];

  return (
    <WidgetShell
      title="RequestJourney · same network, different outcomes"
      measurements={`step ${step + 1}/${STEPS.length} · Allow-Origin ${allow ? "on" : "off"}`}
      caption={current.caption(allow)}
      controls={
        <div className="flex items-center gap-[var(--spacing-md)] flex-wrap">
          <Stepper value={step} total={STEPS.length} onChange={setStep} />
          <motion.button
            type="button"
            onClick={() => setAllow((v) => !v)}
            aria-pressed={allow}
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
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
        role="img"
        aria-label={`Request journey step ${step + 1}: ${current.label}`}
      >
        <defs>
          <marker
            id="arrow-default"
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
            id="arrow-accent"
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

        {/* Lifelines */}
        {LANE_LABELS.map((lane, i) => (
          <g key={lane}>
            <text
              x={colX(i)}
              y={TOP - 12}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={13}
              fill="var(--color-text-muted)"
              fontWeight={500}
            >
              {lane}
            </text>
            <line
              x1={colX(i)}
              x2={colX(i)}
              y1={TOP}
              y2={BOT}
              stroke="var(--color-rule)"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          </g>
        ))}

        {/* The "gate" — visually mark the browser/JS seam at the decision step */}
        <motion.rect
          x={colX(0) - 12}
          y={TOP + 180}
          width={colX(1) - colX(0) + 24}
          height={36}
          rx={3}
          fill={
            step >= 5
              ? allow
                ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                : "color-mix(in oklab, var(--color-accent) 10%, transparent)"
              : "transparent"
          }
          stroke={step >= 5 ? "var(--color-accent)" : "var(--color-rule)"}
          strokeWidth={step >= 5 ? 1.5 : 1}
          strokeDasharray={step >= 5 ? undefined : "4 3"}
          initial={false}
          animate={{
            opacity: step >= 4 ? 1 : 0.35,
          }}
          transition={SPRING.smooth}
        />
        <text
          x={(colX(0) + colX(1)) / 2}
          y={TOP + 176}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill="var(--color-text-muted)"
        >
          browser ↔ JS boundary
        </text>

        {/* Messages */}
        {messages.map((m, idx) => {
          const visible = step >= m.from;
          const isCurrent = step === m.from;
          const past = step > m.from && (m.through ? step > m.through : true);
          const x1 = colX(m.fromCol);
          const x2 = colX(m.toCol);
          const isSelf = m.fromCol === m.toCol;

          const tone =
            m.tone === "accent"
              ? "var(--color-accent)"
              : m.tone === "muted"
                ? "var(--color-text-muted)"
                : isCurrent
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)";
          const stroke = tone;
          const textFill =
            m.tone === "accent"
              ? "var(--color-accent)"
              : isCurrent
                ? "var(--color-text)"
                : past
                  ? "var(--color-text-muted)"
                  : "var(--color-text-muted)";

          const arrowMarker =
            m.tone === "accent" ? "url(#arrow-accent)" : "url(#arrow-default)";

          return (
            <motion.g
              key={`m-${idx}`}
              initial={false}
              animate={{
                opacity: visible ? (isCurrent ? 1 : past ? 0.55 : 0) : 0,
              }}
              transition={SPRING.smooth}
            >
              {isSelf ? (
                <>
                  <path
                    d={`M ${x1 + 4} ${m.y} q 28 0 28 16 q 0 16 -28 16`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isCurrent ? 1.6 : 1}
                    markerEnd={arrowMarker}
                  />
                  <text
                    x={x1 + 40}
                    y={m.y + 20}
                    fontFamily="var(--font-mono)"
                    fontSize={12}
                    fill={textFill}
                  >
                    {m.label}
                  </text>
                </>
              ) : (
                <>
                  <line
                    x1={x1}
                    x2={x2}
                    y1={m.y}
                    y2={m.y}
                    stroke={stroke}
                    strokeWidth={isCurrent ? 1.8 : 1}
                    markerEnd={arrowMarker}
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={m.y - 6}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize={12}
                    fill={textFill}
                  >
                    {m.label}
                  </text>
                </>
              )}
            </motion.g>
          );
        })}

        {/* DevTools summary panel below */}
        <g>
          <rect
            x={LEFT_PAD}
            y={BOT + 20}
            width={WIDTH - LEFT_PAD - RIGHT_PAD}
            height={76}
            rx={3}
            fill="color-mix(in oklab, var(--color-surface) 60%, transparent)"
            stroke="var(--color-rule)"
            strokeWidth={1}
          />
          <text
            x={LEFT_PAD + 12}
            y={BOT + 36}
            fontFamily="var(--font-mono)"
            fontSize={11}
            fill="var(--color-text-muted)"
          >
            DevTools
          </text>
          <text
            x={LEFT_PAD + 12}
            y={BOT + 58}
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill="var(--color-text)"
          >
            Network
          </text>
          <motion.text
            x={LEFT_PAD + 100}
            y={BOT + 58}
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill="var(--color-text)"
            initial={false}
            animate={{ opacity: step >= 4 ? 1 : 0.25 }}
            transition={SPRING.smooth}
          >
            GET /me · 200 OK · 142 B
          </motion.text>

          <text
            x={LEFT_PAD + 12}
            y={BOT + 82}
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill="var(--color-text)"
          >
            Console
          </text>
          <motion.text
            x={LEFT_PAD + 100}
            y={BOT + 82}
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill={allow ? "var(--color-text-muted)" : "var(--color-accent)"}
            initial={false}
            animate={{ opacity: step >= 5 ? 1 : 0.25 }}
            transition={SPRING.smooth}
          >
            {allow
              ? "▸ Response { ok: true, … }"
              : "✗ TypeError: Failed to fetch"}
          </motion.text>
        </g>
      </svg>
    </WidgetShell>
  );
}
