"use client";

import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";

export const DURATION_MS = 10_000;
export const EVENT_TIMES_MS = [800, 2200, 4700, 6200, 8400] as const;

export type EventFate =
  | { kind: "delivered"; at: number }
  | { kind: "replayed"; at: number }
  | { kind: "lost" };

export type ClassifiedEvent = {
  id: number;
  t: number;
  ws: EventFate;
  sse: EventFate;
};

export function classify(
  t: number,
  dropAt: number,
  dropEnd: number,
): { ws: EventFate; sse: EventFate } {
  const beforeDrop = t < dropAt;
  const duringDrop = t >= dropAt && t < dropEnd;
  if (beforeDrop) {
    return { ws: { kind: "delivered", at: t }, sse: { kind: "delivered", at: t } };
  }
  if (duringDrop) {
    return { ws: { kind: "lost" }, sse: { kind: "replayed", at: dropEnd } };
  }
  return { ws: { kind: "lost" }, sse: { kind: "delivered", at: t } };
}

/* -------------------------------------------------------------------------- */
/*                                TwoRowCanvas                                */
/* -------------------------------------------------------------------------- */

/**
 * TwoRowCanvas — the §5 reconnect canvas: two horizontal lifelines, WS above
 * and SSE below, with a dropout band overlaid on both. Renders the events
 * and the SSE replay arcs. The `scrubbedEdge` prop drives the visual
 * distinctness affordance (B5):
 *
 * - `scrubbedEdge="left"` → DropTiming. The dropout band's LEFT edge carries
 *   a 1px terracotta tick + a `cliff` label rising 8px above the WS row.
 *   The right edge is plain.
 * - `scrubbedEdge="right"` → GapDuration. The band's RIGHT edge carries the
 *   tick + a `gap end` label. The left edge is plain.
 *
 * Together the two affordances make adjacent canvases visually different at
 * default scrubber values, before the reader has touched a control.
 */
export function TwoRowCanvas({
  classified,
  dropAt,
  dropEnd,
  lastSseId,
  variant,
  scrubbedEdge,
}: {
  classified: ClassifiedEvent[];
  dropAt: number;
  dropEnd: number;
  lastSseId: number;
  variant: "wide" | "narrow";
  scrubbedEdge: "left" | "right";
}) {
  if (variant === "wide") {
    return (
      <WideCanvas
        classified={classified}
        dropAt={dropAt}
        dropEnd={dropEnd}
        lastSseId={lastSseId}
        scrubbedEdge={scrubbedEdge}
      />
    );
  }
  return (
    <NarrowCanvas
      classified={classified}
      dropAt={dropAt}
      dropEnd={dropEnd}
      lastSseId={lastSseId}
      scrubbedEdge={scrubbedEdge}
    />
  );
}

function WideCanvas({
  classified,
  dropAt,
  dropEnd,
  lastSseId,
  scrubbedEdge,
}: {
  classified: ClassifiedEvent[];
  dropAt: number;
  dropEnd: number;
  lastSseId: number;
  scrubbedEdge: "left" | "right";
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
        scrubbedEdge={scrubbedEdge}
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

function NarrowCanvas({
  classified,
  dropAt,
  dropEnd,
  lastSseId,
  scrubbedEdge,
}: {
  classified: ClassifiedEvent[];
  dropAt: number;
  dropEnd: number;
  lastSseId: number;
  scrubbedEdge: "left" | "right";
}) {
  const WIDTH = 340;
  const HEIGHT = 320;
  const LEFT = 14;
  const RIGHT = 14;
  const TRACK_W = WIDTH - LEFT - RIGHT;
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
        scrubbedEdge={scrubbedEdge}
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
  scrubbedEdge,
}: {
  xOfT: (t: number) => number;
  dropAt: number;
  dropEnd: number;
  yTop: number;
  bandHeight: number;
  scrubbedEdge: "left" | "right";
}) {
  // The tick + label affordance sits above the band, attached to whichever
  // edge the reader's scrubber controls. Position by `transform` on the
  // outer <motion.g>, never by `top`/`left` (DESIGN.md §9 motion bans).
  const tickX = scrubbedEdge === "left" ? dropAt : dropEnd;
  const labelText = scrubbedEdge === "left" ? "cliff" : "gap end";
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

      {/* Scrubbed-edge affordance — 1px terracotta tick mark + small mono
          label rising 8 px above the WS row. The reader's eye lands here
          because it's the only terracotta thing on the canvas before they
          touch a scrubber. Differentiates DropTiming from GapDuration at
          first glance. (B5.) */}
      <motion.g
        initial={false}
        animate={{ x: xOfT(tickX) }}
        transition={SPRING.snappy}
      >
        <line
          x1={0}
          x2={0}
          y1={yTop}
          y2={yTop + bandHeight}
          stroke="var(--color-accent)"
          strokeWidth={1}
        />
        <text
          x={scrubbedEdge === "left" ? 4 : -4}
          y={yTop - 8}
          textAnchor={scrubbedEdge === "left" ? "start" : "end"}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="var(--color-accent)"
        >
          {labelText}
        </text>
      </motion.g>
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
  const labelX = variant === "narrow" ? Math.min(xPos + 6, 200) : 6;
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
      <motion.circle
        cx={x}
        cy={wsY}
        initial={false}
        animate={{
          r: wsDelivered ? 5 : 4,
          fillOpacity: wsDelivered ? 1 : 0,
          strokeDashoffset: wsDelivered ? 0 : 0.001,
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
