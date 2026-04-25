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

/* Beats 1..5 each correspond to STEPS[1..5]. Each beat is one horizontal
 * connector between the two lanes (browser-lane on the left, server-lane on
 * the right) — direction is encoded in `dir`, which determines arrow head
 * placement. Beat 3 is a self-loop on the server lane (handler runs locally).
 */
type Beat = {
  /** Arrow direction: which lane the connector points TO. */
  dir: "right" | "left" | "self-server" | "self-browser";
  /** Compact token displayed on the connector. */
  token: string;
  /** Tone for color treatment. */
  tone?: "default" | "accent" | "muted";
};

const BEATS: Beat[] = [
  { dir: "right", token: "fetch(url)" }, // step 1: JS in browser → server-bound
  { dir: "right", token: "GET /me · Origin" }, // step 2: request on the wire
  { dir: "self-server", token: "handler runs", tone: "muted" }, // step 3
  { dir: "left", token: "200 OK · body" }, // step 4: response back
  // step 5: the verdict is browser-internal — no wire transmission.
  // Self-loop on the BROWSER lane mirrors beat 3's self-loop on the server,
  // and reinforces the post's thesis: the browser is the enforcer.
  { dir: "self-browser", token: "ACAO match?", tone: "accent" },
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
/*  Mobile-first numbered lane-pair. Two short vertical lanes (browser left,  */
/*  server right). Each beat is a horizontal connector between them — arrow   */
/*  direction is unambiguous because connectors are strictly horizontal.      */
/*  Time flows top-to-bottom. Authored at 320 viewport units; SVG scales up.  */
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
  const WIDTH = 320;
  const TOP_PAD = 28;
  const BEAT_H = 46;
  const BEATS_COUNT = BEATS.length;
  const LANES_BOT = TOP_PAD + BEATS_COUNT * BEAT_H + 8;
  const DEVTOOLS_GAP = 16;
  const DEVTOOLS_H = 64;
  const HEIGHT = LANES_BOT + DEVTOOLS_GAP + DEVTOOLS_H + 12;

  const LANE_LEFT_X = 56; // browser lane center
  const LANE_RIGHT_X = WIDTH - 56; // server lane center
  const CONNECTOR_INSET = 12; // gap between lane glyph and connector tip

  const beatY = (i: number) => TOP_PAD + i * BEAT_H + BEAT_H / 2;
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
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-text-muted)" />
        </marker>
        <marker
          id="arrow-accent-rj"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-accent)" />
        </marker>
        <marker
          id="arrow-muted-rj"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-text-muted)" />
        </marker>
      </defs>

      {/* Lane headers */}
      <text
        x={LANE_LEFT_X}
        y={TOP_PAD - 12}
        textAnchor="middle"
        fontFamily="var(--font-sans)"
        fontSize={11}
        fontWeight={600}
        fill="var(--color-text)"
      >
        browser
      </text>
      <text
        x={LANE_RIGHT_X}
        y={TOP_PAD - 12}
        textAnchor="middle"
        fontFamily="var(--font-sans)"
        fontSize={11}
        fontWeight={600}
        fill="var(--color-text)"
      >
        server
      </text>

      {/* Vertical lanes — dashed rules indicate "time" in each actor's frame */}
      <line
        x1={LANE_LEFT_X}
        x2={LANE_LEFT_X}
        y1={TOP_PAD - 4}
        y2={LANES_BOT}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      <line
        x1={LANE_RIGHT_X}
        x2={LANE_RIGHT_X}
        y1={TOP_PAD - 4}
        y2={LANES_BOT}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />

      {/* Gatekeeper highlight — wraps the LEFT (browser) lane at the verdict
          row. Reinforces the pedagogy: the gate lives on the browser side. */}
      {(() => {
        const gateActive = step >= 5;
        const verdictY = beatY(BEATS_COUNT - 1);
        return (
          <motion.g
            initial={false}
            animate={{ opacity: step >= 4 ? 1 : 0 }}
            transition={SPRING.smooth}
          >
            <rect
              x={LANE_LEFT_X - 14}
              y={verdictY - 16}
              width={28}
              height={32}
              rx={4}
              fill={
                gateActive
                  ? allow
                    ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                    : "color-mix(in oklab, var(--color-accent) 12%, transparent)"
                  : "transparent"
              }
              stroke="var(--color-accent)"
              strokeWidth={gateActive ? 1.4 : 1}
              strokeDasharray={gateActive ? undefined : "2 3"}
            />
          </motion.g>
        );
      })()}

      {/* Beats — one horizontal connector per row */}
      {BEATS.map((beat, idx) => {
        const beatStep = idx + 1; // BEATS[0] corresponds to STEPS[1]
        const visible = step >= beatStep;
        const isCurrent = step === beatStep;
        const past = step > beatStep;
        const y = beatY(idx);

        const tone =
          beat.tone === "accent"
            ? "var(--color-accent)"
            : beat.tone === "muted"
              ? "var(--color-text-muted)"
              : isCurrent
                ? "var(--color-accent)"
                : "var(--color-text-muted)";
        const arrowMarker =
          beat.tone === "accent"
            ? "url(#arrow-accent-rj)"
            : beat.tone === "muted"
              ? "url(#arrow-muted-rj)"
              : "url(#arrow-default-rj)";

        // Numbered badge sits on the browser side of the row, just outside the lane.
        const badgeX = 18;

        let connector: React.ReactNode;
        if (beat.dir === "right") {
          const x1 = LANE_LEFT_X + CONNECTOR_INSET;
          const x2 = LANE_RIGHT_X - CONNECTOR_INSET;
          connector = (
            <line
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
              stroke={tone}
              strokeWidth={isCurrent ? 1.8 : 1.2}
              markerEnd={arrowMarker}
            />
          );
        } else if (beat.dir === "left") {
          const x1 = LANE_RIGHT_X - CONNECTOR_INSET;
          const x2 = LANE_LEFT_X + CONNECTOR_INSET;
          connector = (
            <line
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
              stroke={tone}
              strokeWidth={isCurrent ? 1.8 : 1.2}
              markerEnd={arrowMarker}
            />
          );
        } else if (beat.dir === "self-server") {
          // self-loop on the server lane: small horizontal arc to the right of
          // LANE_RIGHT_X and back, terminating on the lane.
          const xs = LANE_RIGHT_X - CONNECTOR_INSET;
          connector = (
            <path
              d={`M ${xs} ${y - 8}
                  q 22 0 22 8
                  q 0 8 -22 8`}
              fill="none"
              stroke={tone}
              strokeWidth={isCurrent ? 1.8 : 1.2}
              markerEnd={arrowMarker}
            />
          );
        } else {
          // self-loop on the browser lane: mirror of self-server, on the left.
          // Used for the verdict beat — encodes "browser decides internally,
          // no wire transmission" — supports the post's thesis.
          const xs = LANE_LEFT_X + CONNECTOR_INSET;
          connector = (
            <path
              d={`M ${xs} ${y - 8}
                  q -22 0 -22 8
                  q 0 8 22 8`}
              fill="none"
              stroke={tone}
              strokeWidth={isCurrent ? 1.8 : 1.2}
              markerEnd={arrowMarker}
            />
          );
        }

        return (
          <motion.g
            key={`beat-${idx}`}
            initial={false}
            animate={{
              opacity: visible ? (isCurrent ? 1 : past ? 0.55 : 0) : 0.12,
            }}
            transition={SPRING.smooth}
          >
            {/* Step badge — circled number outside the browser lane */}
            <circle
              cx={badgeX}
              cy={y}
              r={9}
              fill={isCurrent ? "var(--color-accent)" : "transparent"}
              stroke={
                isCurrent
                  ? "var(--color-accent)"
                  : past
                    ? "var(--color-text-muted)"
                    : "var(--color-rule)"
              }
              strokeWidth={1}
            />
            <text
              x={badgeX}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fontWeight={600}
              fill={isCurrent ? "var(--color-bg)" : "var(--color-text-muted)"}
            >
              {beatStep}
            </text>

            {connector}

            {/* Connector token — sits above the line, centered between the lanes */}
            <text
              x={(LANE_LEFT_X + LANE_RIGHT_X) / 2}
              y={y - 6}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill={isCurrent ? "var(--color-text)" : "var(--color-text-muted)"}
            >
              {beat.token}
            </text>
          </motion.g>
        );
      })}

      {/* Compact DevTools panel — preserves the discard-beat pedagogy */}
      <g>
        <rect
          x={16}
          y={LANES_BOT + DEVTOOLS_GAP}
          width={WIDTH - 32}
          height={DEVTOOLS_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 60%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={24}
          y={LANES_BOT + DEVTOOLS_GAP + 16}
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
            x={24}
            y={LANES_BOT + DEVTOOLS_GAP + 32}
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill="var(--color-text)"
          >
            Net · 200 OK · body
          </text>
          <motion.rect
            x={24}
            y={LANES_BOT + DEVTOOLS_GAP + 28}
            width={120}
            height={1.5}
            fill="var(--color-accent)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: showDiscard ? 1 : 0 }}
            transition={SPRING.smooth}
            style={{
              transformOrigin: `24px ${LANES_BOT + DEVTOOLS_GAP + 28}px`,
            }}
          />
        </motion.g>

        <motion.text
          x={24}
          y={LANES_BOT + DEVTOOLS_GAP + 50}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill={allow ? "var(--color-text-muted)" : "var(--color-accent)"}
          initial={false}
          animate={{ opacity: step >= 5 ? 1 : 0.25 }}
          transition={SPRING.smooth}
        >
          {step >= 5
            ? allow
              ? "▸ Response {…}"
              : "✗ TypeError: Failed to fetch"
            : "▸ awaiting verdict"}
        </motion.text>
      </g>
    </svg>
  );
}
