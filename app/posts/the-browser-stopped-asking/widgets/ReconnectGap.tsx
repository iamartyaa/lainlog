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

type ClassifiedEvent = {
  id: number;
  t: number;
  ws: EventFate;
  sse: EventFate;
};

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

  const classified: ClassifiedEvent[] = EVENT_TIMES_MS.map((t, idx) => ({
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
      {/* Both SVGs render; CSS container query picks which is visible. */}
      <div className="bs-rg-narrow">
        <NarrowCanvas
          classified={classified}
          dropAt={dropAt}
          dropEnd={dropEnd}
          lastSseId={lastSseId}
        />
      </div>
      <div className="bs-rg-wide">
        <WideCanvas
          classified={classified}
          dropAt={dropAt}
          dropEnd={dropEnd}
          lastSseId={lastSseId}
        />
      </div>
    </WidgetShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Wide (desktop)                               */
/* -------------------------------------------------------------------------- */

function WideCanvas({
  classified,
  dropAt,
  dropEnd,
  lastSseId,
}: {
  classified: ClassifiedEvent[];
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
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
      role="img"
      aria-label="Dropout recovery: WebSocket row vs SSE row"
    >
      <RowLabel x={8} y={WS_Y - 18} title="WebSocket" sub="no reconnect" />
      <RowLabel x={8} y={SSE_Y - 18} title="SSE" sub="Last-Event-ID" />

      <Timeline x0={LEFT} x1={LEFT + TRACK_W} y={WS_Y} />
      <Timeline x0={LEFT} x1={LEFT + TRACK_W} y={SSE_Y} />

      <TimeAxis xStart={LEFT} xEnd={LEFT + TRACK_W} y={HEIGHT - 8} />

      <DropoutBand
        xOfT={x}
        dropAt={dropAt}
        dropEnd={dropEnd}
        yTop={WS_Y - 22}
        bandHeight={SSE_Y - WS_Y + 44}
      />

      <ReconnectLabel
        xOfT={x}
        dropEnd={dropEnd}
        yBase={SSE_Y}
        lastSseId={lastSseId}
        variant="wide"
      />

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
  );
}

/* -------------------------------------------------------------------------- */
/*                              Narrow (mobile)                               */
/* -------------------------------------------------------------------------- */

function NarrowCanvas({
  classified,
  dropAt,
  dropEnd,
  lastSseId,
}: {
  classified: ClassifiedEvent[];
  dropAt: number;
  dropEnd: number;
  lastSseId: number;
}) {
  const WIDTH = 380;
  const HEIGHT = 320;
  const LEFT = 16;
  const RIGHT = 16;
  const TRACK_W = WIDTH - LEFT - RIGHT;
  // Labels sit ABOVE each timeline at narrow widths instead of in a left gutter.
  const WS_LABEL_Y = 22;
  const WS_Y = 72;
  const SSE_LABEL_Y = 154;
  const SSE_Y = 204;
  const x = (t: number) => LEFT + (t / DURATION_MS) * TRACK_W;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
      role="img"
      aria-label="Dropout recovery (compact): WebSocket row vs SSE row"
    >
      <RowLabelInline x={LEFT} y={WS_LABEL_Y} title="WebSocket" sub="no reconnect" />
      <RowLabelInline x={LEFT} y={SSE_LABEL_Y} title="SSE" sub="Last-Event-ID" />

      <Timeline x0={LEFT} x1={LEFT + TRACK_W} y={WS_Y} />
      <Timeline x0={LEFT} x1={LEFT + TRACK_W} y={SSE_Y} />

      <TimeAxis xStart={LEFT} xEnd={LEFT + TRACK_W} y={HEIGHT - 8} />

      <DropoutBand
        xOfT={x}
        dropAt={dropAt}
        dropEnd={dropEnd}
        yTop={WS_Y - 22}
        bandHeight={SSE_Y - WS_Y + 44}
      />

      <ReconnectLabel
        xOfT={x}
        dropEnd={dropEnd}
        yBase={SSE_Y}
        lastSseId={lastSseId}
        variant="narrow"
      />

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
  );
}

/* -------------------------------------------------------------------------- */
/*                          Shared canvas primitives                          */
/* -------------------------------------------------------------------------- */

function RowLabel({
  x,
  y,
  title,
  sub,
}: {
  x: number;
  y: number;
  title: string;
  sub: string;
}) {
  return (
    <>
      <text
        x={x}
        y={y}
        fontFamily="var(--font-sans)"
        fontSize={13}
        fontWeight={500}
        fill="var(--color-text-muted)"
      >
        {title}
      </text>
      <text
        x={x}
        y={y + 20}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        {sub}
      </text>
    </>
  );
}

function RowLabelInline({
  x,
  y,
  title,
  sub,
}: {
  x: number;
  y: number;
  title: string;
  sub: string;
}) {
  return (
    <g>
      <text
        x={x}
        y={y}
        fontFamily="var(--font-sans)"
        fontSize={13}
        fontWeight={500}
        fill="var(--color-text)"
      >
        {title}
      </text>
      <text
        x={x}
        y={y + 16}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        {sub}
      </text>
    </g>
  );
}

function Timeline({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <line
      x1={x0}
      x2={x1}
      y1={y}
      y2={y}
      stroke="var(--color-rule)"
      strokeWidth={1}
      strokeDasharray="3 4"
    />
  );
}

function TimeAxis({ xStart, xEnd, y }: { xStart: number; xEnd: number; y: number }) {
  return (
    <>
      <text
        x={xStart}
        y={y}
        fontFamily="var(--font-sans)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        0s
      </text>
      <text
        x={xEnd}
        y={y}
        textAnchor="end"
        fontFamily="var(--font-sans)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        {DURATION_MS / 1000}s
      </text>
    </>
  );
}

function DropoutBand({
  xOfT,
  dropAt,
  dropEnd,
  yTop,
  bandHeight,
}: {
  xOfT: (t: number) => number;
  dropAt: number;
  dropEnd: number;
  yTop: number;
  bandHeight: number;
}) {
  return (
    <>
      <motion.g
        initial={false}
        animate={{
          x: xOfT(dropAt),
          scaleX: (xOfT(dropEnd) - xOfT(dropAt)) / 100,
        }}
        transition={SPRING.snappy}
        style={{ transformOrigin: "0 0", transformBox: "fill-box" }}
      >
        <rect
          x={0}
          y={yTop}
          width={100}
          height={bandHeight}
          fill="color-mix(in oklab, var(--color-text-muted) 7%, transparent)"
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>
      <motion.text
        initial={false}
        animate={{ x: xOfT(dropAt) + 6 }}
        transition={SPRING.snappy}
        y={yTop - 4}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        network dropout
      </motion.text>
    </>
  );
}

function ReconnectLabel({
  xOfT,
  dropEnd,
  yBase,
  lastSseId,
  variant,
}: {
  xOfT: (t: number) => number;
  dropEnd: number;
  yBase: number;
  lastSseId: number;
  variant: "wide" | "narrow";
}) {
  const visible = dropEnd < DURATION_MS;
  const xPos = xOfT(dropEnd);
  // Narrow places labels right of the reconnect line, below the SSE row.
  // Wide places them below-left of the row.
  const labelX = variant === "narrow" ? Math.min(xPos + 6, 240) : 6;
  return (
    <motion.g
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={SPRING.smooth}
    >
      <line
        x1={xPos}
        x2={xPos}
        y1={yBase - 16}
        y2={yBase + 18}
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        strokeDasharray="3 2"
      />
      <text
        x={variant === "narrow" ? labelX : xPos + 6}
        y={yBase + 34}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-accent)"
      >
        GET /stream
      </text>
      <text
        x={variant === "narrow" ? labelX : xPos + 6}
        y={yBase + 48}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-accent)"
      >
        Last-Event-ID: evt-{lastSseId}
      </text>
    </motion.g>
  );
}

function EventMark({
  event,
  x,
  xReplay,
  wsY,
  sseY,
}: {
  event: ClassifiedEvent;
  x: number;
  xReplay?: number;
  wsY: number;
  sseY: number;
}) {
  const label = `evt-${event.id}`;
  const wsDelivered = event.ws.kind === "delivered";
  return (
    <g>
      {/* WS row — the ring transitions smoothly when the dropout swallows or
          releases this event. motion.circle interpolates radius and fill-
          opacity, so the "delivered → lost" swap plays as a micro-moment of
          loss instead of a silent attribute swap. The dashed stroke + X
          mark cross-fade via AnimatePresence siblings. */}
      <motion.circle
        cx={x}
        cy={wsY}
        initial={false}
        animate={{
          r: wsDelivered ? 5 : 4,
          fillOpacity: wsDelivered ? 1 : 0,
          strokeDashoffset: wsDelivered ? 0 : 0.001, // nudge to retrigger dash
        }}
        transition={SPRING.snappy}
        fill="var(--color-accent)"
        stroke={wsDelivered ? "var(--color-accent)" : "var(--color-text-muted)"}
        strokeWidth={1.4}
        strokeDasharray={wsDelivered ? "0 0" : "2 2"}
      />
      {!wsDelivered ? (
        <motion.g
          key={`x-${event.id}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING.snappy}
          style={{ transformOrigin: `${x}px ${wsY}px` }}
        >
          <line
            x1={x - 3.5}
            x2={x + 3.5}
            y1={wsY - 3.5}
            y2={wsY + 3.5}
            stroke="var(--color-text-muted)"
            strokeWidth={1.1}
          />
        </motion.g>
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

      {/* SSE row */}
      {event.sse.kind === "replayed" && xReplay !== undefined ? (
        <g key={`replay-${event.id}-${xReplay.toFixed(0)}`}>
          <circle
            cx={x}
            cy={sseY}
            r={3}
            fill="transparent"
            stroke="var(--color-text-muted)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
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
