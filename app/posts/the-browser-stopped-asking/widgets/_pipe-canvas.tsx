"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SPRING, TIMING } from "@/lib/motion";
import {
  DURATION_MS,
  EVENTS_MS,
  WS_HANDSHAKE_MS,
  type Msg,
  type Sim,
  type Stats,
} from "./_pipe-sim";

type Protocol = "polling" | "longpoll" | "websocket";

/**
 * ProtocolCanvas — one protocol's behaviour, one 10-second window. Renders a
 * browser/server pair of lifelines, server events as terracotta stars, the
 * messages on the wire (with kind-specific styling), and a playhead that
 * walks left-to-right at the rAF cadence the parent widget owns.
 *
 * The canvas is authored at the requested width and scales fluidly via its
 * SVG viewBox. The parent widget picks one width for narrow-only and a
 * larger one for wide layouts; it doesn't have to render two siblings,
 * because the geometry inside doesn't change shape between the two — only
 * its on-screen size does.
 */
export const ProtocolCanvas = memo(ProtocolCanvasImpl);

function ProtocolCanvasImpl({
  protocol,
  sim,
  nowMs,
  authoredWidth,
}: {
  protocol: Protocol;
  sim: Sim;
  nowMs: number;
  /** Authored width in SVG units. The viewBox handles fluid scaling. */
  authoredWidth: number;
}) {
  const WIDTH = authoredWidth;
  const HEIGHT = 132;
  const LEFT = 12;
  const RIGHT = 12;
  const TRACK_W = WIDTH - LEFT - RIGHT;
  const BROWSER_Y = 48;
  const SERVER_Y = 104;
  const x = (t: number) =>
    LEFT + (Math.max(0, Math.min(DURATION_MS, t)) / DURATION_MS) * TRACK_W;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
      role="img"
      aria-label={`${labelFor(protocol)} at t = ${(nowMs / 1000).toFixed(1)}s`}
    >
      {/* Browser + server lifelines */}
      <text
        x={LEFT}
        y={BROWSER_Y - 6}
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--color-text-muted)"
      >
        browser
      </text>
      <line
        x1={LEFT}
        x2={LEFT + TRACK_W}
        y1={BROWSER_Y}
        y2={BROWSER_Y}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      <line
        x1={LEFT}
        x2={LEFT + TRACK_W}
        y1={SERVER_Y}
        y2={SERVER_Y}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      <text
        x={LEFT}
        y={SERVER_Y + 14}
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--color-text-muted)"
      >
        server
      </text>

      {/* Server events (stars) — same scale-in + ring-ripple as the legacy
          PipeCanvas so the first appearance of each event teaches instead
          of pops. Remounts once per crossing of nowMs ≥ e. */}
      {EVENTS_MS.filter((e) => e <= nowMs).map((e) => (
        <g key={`evt-${protocol}-${e}`} transform={`translate(${x(e)}, ${SERVER_Y})`}>
          <motion.circle
            r={3.2}
            cx={0}
            cy={0}
            fill="var(--color-accent)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRING.snappy}
            style={{ transformOrigin: "0 0" }}
          />
          <motion.circle
            cx={0}
            cy={0}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={0.8}
            initial={{ r: 3, opacity: 0.9 }}
            animate={{ r: 12, opacity: 0 }}
            transition={TIMING.slow}
          />
          <circle
            r={6}
            cx={0}
            cy={0}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={0.8}
            opacity={0.35}
          />
        </g>
      ))}

      {/* Long-poll: held-request span (current) */}
      {sim.heldSpan ? (
        <rect
          x={x(sim.heldSpan.from)}
          y={BROWSER_Y + 2}
          width={Math.max(1, x(sim.heldSpan.to) - x(sim.heldSpan.from))}
          height={SERVER_Y - BROWSER_Y - 4}
          fill="color-mix(in oklab, var(--color-accent) 10%, transparent)"
          stroke="var(--color-accent)"
          strokeWidth={0.8}
          opacity={0.8}
        />
      ) : null}
      {protocol === "longpoll"
        ? sim.messages
            .filter((m) => m.held)
            .map((m, i) => (
              <rect
                key={`held-${i}`}
                x={x(m.tStart)}
                y={BROWSER_Y + 2}
                width={Math.max(1, x(m.tEnd) - x(m.tStart))}
                height={SERVER_Y - BROWSER_Y - 4}
                fill="color-mix(in oklab, var(--color-text-muted) 8%, transparent)"
                stroke="var(--color-text-muted)"
                strokeWidth={0.8}
                strokeDasharray="3 3"
                opacity={0.55}
              />
            ))
        : null}

      {/* WebSocket persistent pipe — strokes in once handshake completes. */}
      {protocol === "websocket" && nowMs >= WS_HANDSHAKE_MS ? (
        <line
          x1={x(WS_HANDSHAKE_MS)}
          x2={x(nowMs)}
          y1={(BROWSER_Y + SERVER_Y) / 2}
          y2={(BROWSER_Y + SERVER_Y) / 2}
          stroke="var(--color-accent)"
          strokeWidth={3}
          opacity={0.75}
        />
      ) : null}

      {/* Messages */}
      {sim.messages.map((m) =>
        m.held ? null : (
          <MessageArrow
            key={`m-${protocol}-${m.kind}-${m.tStart}-${m.tEnd}`}
            m={m}
            xOfT={x}
            browserY={BROWSER_Y}
            serverY={SERVER_Y}
            nowMs={nowMs}
          />
        ),
      )}

      {/* Playhead */}
      <line
        x1={x(nowMs)}
        x2={x(nowMs)}
        y1={BROWSER_Y - 14}
        y2={SERVER_Y + 16}
        stroke="var(--color-accent)"
        strokeWidth={1.2}
        strokeDasharray="4 3"
        opacity={0.45}
      />

      {/* Mini time axis */}
      <text
        x={LEFT}
        y={HEIGHT - 4}
        fontFamily="var(--font-mono)"
        fontSize={8}
        fill="var(--color-text-muted)"
      >
        0s
      </text>
      <text
        x={LEFT + TRACK_W}
        y={HEIGHT - 4}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize={8}
        fill="var(--color-text-muted)"
      >
        {DURATION_MS / 1000}s
      </text>
    </svg>
  );
}

function labelFor(protocol: Protocol): string {
  switch (protocol) {
    case "polling":
      return "polling";
    case "longpoll":
      return "long polling";
    case "websocket":
      return "WebSocket";
  }
}

/* -------------------------------------------------------------------------- */
/*                                Stats line                                  */
/* -------------------------------------------------------------------------- */

/**
 * StatLine — final-stats rendering shared by all three protocol widgets.
 * Three load-bearing numbers each, formatted identically so the reader
 * can compare across widgets visually: count, bytes, max delta.
 */
export function StatLine({
  protocol,
  stats,
}: {
  protocol: Protocol;
  stats: Stats;
}) {
  const bytes =
    stats.bytesSent >= 1000
      ? `${(stats.bytesSent / 1000).toFixed(1)} KB`
      : `${stats.bytesSent} B`;
  const countLabel =
    protocol === "polling"
      ? `${stats.reqs} polls`
      : protocol === "longpoll"
        ? `${stats.reqs} requests`
        : `${stats.eventsDelivered} frames`;
  const maxDelta =
    stats.worstLatencyMs > 0 ? `max Δ ${formatMs(stats.worstLatencyMs)}` : "max Δ —";
  return (
    <span
      className="font-mono tabular-nums"
      style={{
        fontSize: "var(--text-small)",
        color: "var(--color-text-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {countLabel} · {bytes} · {maxDelta}
    </span>
  );
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms)} ms`;
}

/* -------------------------------------------------------------------------- */
/*                              MessageArrow                                  */
/* -------------------------------------------------------------------------- */

function MessageArrow({
  m,
  xOfT,
  browserY,
  serverY,
  nowMs,
}: {
  m: Msg;
  xOfT: (t: number) => number;
  browserY: number;
  serverY: number;
  nowMs: number;
}) {
  const isRecent = Math.abs(nowMs - m.tEnd) < 350;
  const baseColor =
    m.kind === "emptyRes"
      ? "var(--color-text-muted)"
      : m.kind === "handshakeReq" || m.kind === "handshakeRes"
        ? "var(--color-text-muted)"
        : "var(--color-accent)";
  const opacity = m.kind === "emptyRes" ? 0.55 : isRecent ? 1 : 0.78;
  const strokeWidth = isRecent ? 1.8 : 1.1;

  const x1 = xOfT(m.tStart);
  const x2 = xOfT(m.tEnd);
  const y1 = m.dir === "down" ? browserY : serverY;
  const y2 = m.dir === "down" ? serverY : browserY;
  const originX = (x1 + x2) / 2;
  const originY = (y1 + y2) / 2;

  if (Math.abs(m.tStart - m.tEnd) < 4) {
    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity, scale: 1 }}
        transition={SPRING.snappy}
        style={{ transformOrigin: `${originX}px ${originY}px`, transformBox: "view-box" }}
      >
        <line x1={x1} x2={x2} y1={y1} y2={y2} stroke={baseColor} strokeWidth={strokeWidth} />
        <path
          d={arrowHeadPath(x2, y2, m.dir === "down" ? "down" : "up")}
          fill={baseColor}
        />
        {isRecent ? (
          <text
            x={x1 + 4}
            y={(y1 + y2) / 2}
            fontFamily="var(--font-mono)"
            fontSize={8}
            fill={baseColor}
          >
            {labelForKind(m.kind)}
          </text>
        ) : null}
      </motion.g>
    );
  }

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity, scale: 1 }}
      transition={SPRING.snappy}
      style={{ transformOrigin: `${originX}px ${originY}px`, transformBox: "view-box" }}
    >
      <line x1={x1} x2={x2} y1={y1} y2={y2} stroke={baseColor} strokeWidth={strokeWidth} />
      <path d={arrowHeadPath(x2, y2, m.dir === "down" ? "down" : "up")} fill={baseColor} />
    </motion.g>
  );
}

function labelForKind(kind: Msg["kind"]): string {
  switch (kind) {
    case "req":
      return "GET";
    case "emptyRes":
      return "200 []";
    case "dataRes":
      return "200";
    case "frameUp":
      return "0x1";
    case "frameDown":
      return "0x1";
    case "handshakeReq":
      return "Upgrade";
    case "handshakeRes":
      return "101";
    default:
      return "";
  }
}

function arrowHeadPath(x: number, y: number, dir: "up" | "down"): string {
  const h = 5;
  if (dir === "down") {
    return `M ${x - h} ${y - h} L ${x + h} ${y - h} L ${x} ${y} Z`;
  }
  return `M ${x - h} ${y + h} L ${x + h} ${y + h} L ${x} ${y} Z`;
}

/* -------------------------------------------------------------------------- */
/*                             usePlayClock hook                              */
/* -------------------------------------------------------------------------- */

/**
 * usePlayClock — shared rAF-driven 0..DURATION_MS clock for the three protocol
 * widgets. Returns the current `nowMs`, a `playing` flag, and a `toggle`
 * action that handles the pause/resume/replay-from-end transitions.
 *
 * **rAF idleness contract (B1)**: when `playing` is false, the effect cancels
 * the rAF callback in `useEffect` cleanup and never schedules another. An
 * idle widget — three on the page, none playing — registers zero rAF
 * callbacks. When the reader presses play on one widget, only that widget's
 * loop runs at 60 fps until it ends or pauses.
 *
 * Reduced-motion: pressing play snaps directly to DURATION_MS end-state and
 * leaves `playing` false. The reader sees the finished comparison without
 * the animation, consistent with DESIGN.md §11 + interactive-components.md §3.
 */
export function usePlayClock(): {
  nowMs: number;
  playing: boolean;
  toggle: () => void;
} {
  const [nowMs, setNowMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const baseMsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  const toggle = useCallback(() => {
    // Replay from end-state.
    if (nowMs >= DURATION_MS) {
      setNowMs(0);
      baseMsRef.current = 0;
      startedAtRef.current = null;
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [nowMs]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    if (reducedMotion) {
      setNowMs(DURATION_MS);
      baseMsRef.current = DURATION_MS;
      setPlaying(false);
      return;
    }
    let cancelled = false;
    const tick = (tNow: number) => {
      if (cancelled) return;
      if (startedAtRef.current == null) startedAtRef.current = tNow;
      const elapsed = tNow - startedAtRef.current;
      const next = baseMsRef.current + elapsed;
      if (next >= DURATION_MS) {
        setNowMs(DURATION_MS);
        setPlaying(false);
        return;
      }
      setNowMs(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing, reducedMotion]);

  return { nowMs, playing, toggle };
}
