"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { Scrubber } from "@/components/viz/Scrubber";
import { WidgetShell } from "./WidgetShell";

const DURATION_MS = 10_000;
const EVENT_TIMES_MS = [800, 2200, 4700, 6200, 8400] as const;

type EventFate =
  | { kind: "delivered"; at: number }
  | { kind: "replayed"; at: number }
  | { kind: "lost" };

function classify(t: number, dropAt: number, dropEnd: number): {
  ws: EventFate;
  sse: EventFate;
} {
  const beforeDrop = t < dropAt;
  const duringDrop = t >= dropAt && t < dropEnd;
  if (beforeDrop) {
    return { ws: { kind: "delivered", at: t }, sse: { kind: "delivered", at: t } };
  }
  if (duringDrop) {
    return { ws: { kind: "lost" }, sse: { kind: "replayed", at: dropEnd } };
  }
  return {
    ws: { kind: "lost" },
    sse: { kind: "delivered", at: t },
  };
}

export function ReconnectGap() {
  const [dropAt, setDropAt] = useState(3500);
  const [dropMs, setDropMs] = useState(2200);
  const dropEnd = Math.min(dropAt + dropMs, DURATION_MS);

  const classified = EVENT_TIMES_MS.map((t, idx) => ({
    id: idx + 1,
    t,
    ...classify(t, dropAt, dropEnd),
  }));

  const wsLost = classified.filter((e) => e.ws.kind === "lost").length;
  const sseDelivered = classified.filter((e) => e.sse.kind !== "lost").length;

  const lastBeforeDrop = classified.filter((e) => e.t < dropAt).slice(-1)[0];
  const lastSseId = lastBeforeDrop?.id ?? 0;

  return (
    <WidgetShell
      title="WebSocket forgets, SSE remembers"
      measurements={`delivered: WS ${classified.length - wsLost}/${classified.length} · SSE ${sseDelivered}/${classified.length}`}
      caption={
        <>
          Drag the dropout. WebSocket has no built-in way to recover the missed
          events — the spec contains no reconnect. SSE auto-reconnects with a{" "}
          <code>Last-Event-ID</code>{" "}header so the server can replay whatever the
          browser missed.
        </>
      }
      controls={
        <div className="grid grid-cols-1 gap-[var(--spacing-sm)] sm:grid-cols-2">
          <Scrubber
            label="drop@"
            value={dropAt}
            min={400}
            max={DURATION_MS - 1400}
            step={100}
            onChange={setDropAt}
            format={(v) => `${(v / 1000).toFixed(1)}s`}
          />
          <Scrubber
            label="for"
            value={dropMs}
            min={400}
            max={4500}
            step={100}
            onChange={setDropMs}
            format={(v) => `${(v / 1000).toFixed(1)}s`}
          />
        </div>
      }
    >
      <ReconnectCanvas
        classified={classified}
        dropAt={dropAt}
        dropEnd={dropEnd}
        lastSseId={lastSseId}
      />
    </WidgetShell>
  );
}

/* -------------------------------------------------------------------------- */

type Event = {
  id: number;
  t: number;
  ws: EventFate;
  sse: EventFate;
};

function ReconnectCanvas({
  classified,
  dropAt,
  dropEnd,
  lastSseId,
}: {
  classified: Event[];
  dropAt: number;
  dropEnd: number;
  lastSseId: number;
}) {
  const WIDTH = 760;
  const HEIGHT = 260;
  const LEFT = 100;
  const RIGHT = 20;
  const TRACK_W = WIDTH - LEFT - RIGHT;
  const WS_Y = 64;
  const SSE_Y = 176;
  const x = (t: number) => LEFT + (t / DURATION_MS) * TRACK_W;

  return (
    <div style={{ overflowX: "auto", overflowY: "hidden", maxWidth: "100%" }}>
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      style={{ maxWidth: "100%", minWidth: 520, height: "auto", display: "block" }}
      role="img"
      aria-label="Dropout recovery: WebSocket row vs SSE row"
    >
      {/* Row labels */}
      <text
        x={8}
        y={WS_Y - 18}
        fontFamily="var(--font-sans)"
        fontSize={13}
        fontWeight={500}
        fill="var(--color-text-muted)"
      >
        WebSocket
      </text>
      <text
        x={8}
        y={WS_Y + 2}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        no reconnect
      </text>

      <text
        x={8}
        y={SSE_Y - 18}
        fontFamily="var(--font-sans)"
        fontSize={13}
        fontWeight={500}
        fill="var(--color-text-muted)"
      >
        SSE
      </text>
      <text
        x={8}
        y={SSE_Y + 2}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        Last-Event-ID
      </text>

      {/* Timelines */}
      <line
        x1={LEFT}
        x2={LEFT + TRACK_W}
        y1={WS_Y}
        y2={WS_Y}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      <line
        x1={LEFT}
        x2={LEFT + TRACK_W}
        y1={SSE_Y}
        y2={SSE_Y}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />

      {/* Time axis */}
      <text
        x={LEFT}
        y={HEIGHT - 8}
        fontFamily="var(--font-sans)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        0s
      </text>
      <text
        x={LEFT + TRACK_W}
        y={HEIGHT - 8}
        textAnchor="end"
        fontFamily="var(--font-sans)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        {DURATION_MS / 1000}s
      </text>

      {/* Dropout band spanning both rows. Uses translateX + scaleX (transforms
          only) instead of animating width — DESIGN.md §9 bans non-transform
          animation. The base rect is 100px wide at x=0; scaleX stretches it to
          the real dropout duration, translateX places it. */}
      <motion.g
        initial={false}
        animate={{
          x: x(dropAt),
          scaleX: (x(dropEnd) - x(dropAt)) / 100,
        }}
        transition={SPRING.snappy}
        style={{ transformOrigin: "0 0", transformBox: "fill-box" }}
      >
        <rect
          x={0}
          y={WS_Y - 22}
          width={100}
          height={SSE_Y - WS_Y + 44}
          fill="color-mix(in oklab, var(--color-text-muted) 7%, transparent)"
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>
      <motion.text
        initial={false}
        animate={{ x: x(dropAt) + 6 }}
        transition={SPRING.snappy}
        y={WS_Y - 26}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        network dropout
      </motion.text>

      {/* SSE reconnect marker at dropEnd */}
      <motion.g
        initial={false}
        animate={{ x: x(dropEnd), opacity: dropEnd < DURATION_MS ? 1 : 0 }}
        transition={SPRING.smooth}
      >
        <line
          y1={SSE_Y - 16}
          y2={SSE_Y + 18}
          stroke="var(--color-accent)"
          strokeWidth={1.4}
          strokeDasharray="3 2"
        />
        <text
          x={6}
          y={SSE_Y + 34}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="var(--color-accent)"
        >
          GET /stream
        </text>
        <text
          x={6}
          y={SSE_Y + 48}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="var(--color-accent)"
        >
          Last-Event-ID: evt-{lastSseId}
        </text>
      </motion.g>

      {/* Events */}
      {classified.map((e) => (
        <EventMark
          key={e.id}
          event={e}
          x={x(e.t)}
          xReplay={e.sse.kind === "replayed" ? x(e.sse.at) : undefined}
          wsY={WS_Y}
          sseY={SSE_Y}
        />
      ))}
    </svg>
    </div>
  );
}

function EventMark({
  event,
  x,
  xReplay,
  wsY,
  sseY,
}: {
  event: Event;
  x: number;
  xReplay?: number;
  wsY: number;
  sseY: number;
}) {
  const label = `evt-${event.id}`;
  return (
    <g>
      {/* WS: filled if delivered, hollow if lost */}
      <circle
        cx={x}
        cy={wsY}
        r={event.ws.kind === "delivered" ? 5 : 4}
        fill={event.ws.kind === "delivered" ? "var(--color-accent)" : "transparent"}
        stroke={
          event.ws.kind === "delivered" ? "var(--color-accent)" : "var(--color-text-muted)"
        }
        strokeWidth={1.4}
        strokeDasharray={event.ws.kind === "lost" ? "2 2" : undefined}
      />
      {event.ws.kind === "lost" ? (
        <line
          x1={x - 3.5}
          x2={x + 3.5}
          y1={wsY - 3.5}
          y2={wsY + 3.5}
          stroke="var(--color-text-muted)"
          strokeWidth={1.1}
        />
      ) : null}
      <text
        x={x}
        y={wsY - 12}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill={event.ws.kind === "delivered" ? "var(--color-text)" : "var(--color-text-muted)"}
      >
        {label}
      </text>

      {/* SSE: filled when delivered or replayed */}
      {event.sse.kind === "replayed" && xReplay !== undefined ? (
        <g key={`replay-${event.id}-${xReplay.toFixed(0)}`}>
          {/* ghost at original time */}
          <circle
            cx={x}
            cy={sseY}
            r={3}
            fill="transparent"
            stroke="var(--color-text-muted)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          {/* replay arc — strokes itself from origin to destination. The animation
              is the teaching signal: "server replayed this missed event after
              reconnect." Stagger by event.id so a multi-event dropout draws as a
              sequence, not a burst. */}
          <motion.path
            d={`M ${x + 3} ${sseY} Q ${(x + xReplay) / 2} ${sseY - 14} ${xReplay - 3} ${sseY}`}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={1.2}
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              ...SPRING.smooth,
              delay: 0.1 + event.id * 0.06,
            }}
          />
          {/* delivered dot — pops in at the tail after the arc draws */}
          <motion.circle
            cx={xReplay}
            cy={sseY}
            r={5}
            fill="var(--color-accent)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              ...SPRING.snappy,
              delay: 0.34 + event.id * 0.06,
            }}
            style={{ transformOrigin: `${xReplay}px ${sseY}px` }}
          />
          <text
            x={xReplay}
            y={sseY - 12}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={9}
            fill="var(--color-text)"
          >
            {label}
          </text>
        </g>
      ) : (
        <>
          <circle cx={x} cy={sseY} r={5} fill="var(--color-accent)" />
          <text
            x={x}
            y={sseY - 12}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={9}
            fill="var(--color-text)"
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}
