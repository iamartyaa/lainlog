"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { PRESS, SPRING } from "@/lib/motion";
import { Scrubber } from "@/components/viz/Scrubber";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";
import { WidgetShell } from "./WidgetShell";

const DURATION_MS = 10_000;

// Polling knobs
const POLL_INTERVAL_MS = 1000;
const POLL_LATENCY_MS = 120;
const POLL_REQ_BYTES = 520;
const POLL_EMPTY_RES_BYTES = 140;
const POLL_DATA_RES_BYTES = 260;

// Long-polling knobs
const LP_LATENCY_MS = 60;
const LP_REQ_BYTES = 520;
const LP_RES_BYTES = 260;

// WebSocket knobs
const WS_HANDSHAKE_MS = 140;
const WS_HANDSHAKE_BYTES = 520;
const WS_FRAME_BYTES = 14;
const WS_DELIVERY_MS = 10;

// "News" on the server — three events across the 10s window.
const EVENTS_MS = [1600, 4700, 8200] as const;

/* -------------------------------------------------------------------------- */
/*                              Simulation pure-fns                           */
/* -------------------------------------------------------------------------- */

type Stats = {
  reqs: number;
  bytesSent: number;
  eventsDelivered: number;
  worstLatencyMs: number;
};

type Msg = {
  /** t of when the message appears on the wire (start). */
  tStart: number;
  /** t of when it arrives (end). For instantaneous pulses, tEnd === tStart. */
  tEnd: number;
  /** Direction. */
  dir: "down" | "up"; // down = browser→server, up = server→browser
  kind: "req" | "emptyRes" | "dataRes" | "frameUp" | "frameDown" | "handshakeReq" | "handshakeRes";
  /** An optional "span" payload (for long-poll's held request). */
  held?: boolean;
};

type Sim = {
  stats: Stats;
  messages: Msg[];
  /** For long-poll, the *currently-held* request span, if any. */
  heldSpan?: { from: number; to: number };
};

function simPolling(nowMs: number): Sim {
  const messages: Msg[] = [];
  let bytesSent = 0;
  let reqs = 0;
  let eventsDelivered = 0;
  let worst = 0;

  for (let start = 0; start <= nowMs; start += POLL_INTERVAL_MS) {
    // Request fires
    messages.push({ tStart: start, tEnd: start, dir: "down", kind: "req" });
    bytesSent += POLL_REQ_BYTES;
    reqs += 1;

    const resT = start + POLL_LATENCY_MS;
    if (resT > nowMs) break;

    // Did any event land in the window strictly after the previous poll and
    // at-or-before this one? Those get batched into this poll's reply.
    const inWin = EVENTS_MS.filter(
      (e) => e > start - POLL_INTERVAL_MS && e <= start,
    );
    if (inWin.length > 0) {
      messages.push({ tStart: resT, tEnd: resT, dir: "up", kind: "dataRes" });
      bytesSent += POLL_DATA_RES_BYTES;
      eventsDelivered += inWin.length;
      for (const e of inWin) worst = Math.max(worst, resT - e);
    } else {
      messages.push({ tStart: resT, tEnd: resT, dir: "up", kind: "emptyRes" });
      bytesSent += POLL_EMPTY_RES_BYTES;
    }
  }

  return {
    stats: { reqs, bytesSent, eventsDelivered, worstLatencyMs: worst },
    messages,
  };
}

function simLongPoll(nowMs: number): Sim {
  const messages: Msg[] = [];
  let bytesSent = 0;
  let reqs = 0;
  let eventsDelivered = 0;
  let worst = 0;
  let openedAt = 0;
  let heldSpan: Sim["heldSpan"];

  for (let i = 0; i < 40 && openedAt <= nowMs; i++) {
    // Client fires a fresh long-poll request
    messages.push({ tStart: openedAt, tEnd: openedAt, dir: "down", kind: "req" });
    bytesSent += LP_REQ_BYTES;
    reqs += 1;

    const nextEvt = EVENTS_MS.find((e) => e >= openedAt);
    if (nextEvt == null) {
      heldSpan = { from: openedAt, to: nowMs };
      break;
    }

    if (nextEvt > nowMs) {
      heldSpan = { from: openedAt, to: nowMs };
      break;
    }

    const replyT = nextEvt + LP_LATENCY_MS;
    messages.push({
      tStart: openedAt,
      tEnd: Math.min(replyT, nowMs),
      dir: "down",
      kind: "req",
      held: true,
    });

    if (replyT <= nowMs) {
      messages.push({ tStart: replyT, tEnd: replyT, dir: "up", kind: "dataRes" });
      bytesSent += LP_RES_BYTES;
      eventsDelivered += 1;
      worst = Math.max(worst, replyT - nextEvt);
      openedAt = replyT + 2;
    } else {
      heldSpan = { from: openedAt, to: nowMs };
      break;
    }
  }

  return {
    stats: { reqs, bytesSent, eventsDelivered, worstLatencyMs: worst },
    messages,
    heldSpan,
  };
}

function simWebSocket(nowMs: number): Sim {
  const messages: Msg[] = [];
  let bytesSent = 0;
  let reqs = 0;
  let eventsDelivered = 0;
  let worst = 0;

  if (nowMs >= 0) {
    messages.push({ tStart: 0, tEnd: 0, dir: "down", kind: "handshakeReq" });
    reqs += 1;
    bytesSent += WS_HANDSHAKE_BYTES;
  }
  if (nowMs >= WS_HANDSHAKE_MS) {
    messages.push({
      tStart: WS_HANDSHAKE_MS,
      tEnd: WS_HANDSHAKE_MS,
      dir: "up",
      kind: "handshakeRes",
    });
  }
  for (const e of EVENTS_MS) {
    const deliverT = e + WS_DELIVERY_MS;
    if (deliverT <= nowMs) {
      messages.push({ tStart: e, tEnd: deliverT, dir: "up", kind: "frameUp" });
      bytesSent += WS_FRAME_BYTES;
      eventsDelivered += 1;
      worst = Math.max(worst, deliverT - e);
    }
  }

  return {
    stats: { reqs, bytesSent, eventsDelivered, worstLatencyMs: worst },
    messages,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function PipeCompare() {
  const [nowMs, setNowMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const baseMsRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const stepTo = useCallback((ms: number) => {
    const clamped = Math.max(0, Math.min(DURATION_MS, ms));
    setNowMs(clamped);
    baseMsRef.current = clamped;
    startedAtRef.current = null;
  }, []);

  const setFromScrub = useCallback((n: number) => {
    setPlaying(false);
    stepTo(n);
  }, [stepTo]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
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
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const polling = simPolling(nowMs);
  const longpoll = simLongPoll(nowMs);
  const websocket = simWebSocket(nowMs);

  const play = useTapPulse<HTMLButtonElement>();
  const togglePlay = () => {
    play.pulse();
    if (nowMs >= DURATION_MS) {
      stepTo(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  return (
    <WidgetShell
      title="three protocols · one 10-second window"
      measurements={`t = ${(nowMs / 1000).toFixed(1)}s of ${DURATION_MS / 1000}s`}
      caption={
        <>
          Three server events fire during this window (the terracotta stars on each row).
          Polling wastes most of its roundtrips. Long polling keeps one request open
          until news arrives. WebSocket only pays the cost once, at the handshake.
        </>
      }
      controls={
        <div className="flex flex-wrap items-center gap-[var(--spacing-md)]">
          <motion.button
            ref={play.ref}
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause playback" : "Play playback"}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center font-sans transition-colors"
            style={{
              fontSize: "var(--text-ui)",
              color: playing ? "var(--color-accent)" : "var(--color-text)",
              border: "1px solid var(--color-rule)",
            }}
            {...PRESS}
          >
            {playing ? "pause" : nowMs >= DURATION_MS ? "replay ▸" : "play ▸"}
          </motion.button>
          <div className="flex-1 min-w-[200px]">
            <Scrubber
              label="t"
              value={Math.round(nowMs)}
              min={0}
              max={DURATION_MS}
              step={50}
              onChange={setFromScrub}
              format={(v) => `${(v / 1000).toFixed(1)}s`}
            />
          </div>
        </div>
      }
    >
      <PipeCanvas
        nowMs={nowMs}
        polling={polling}
        longpoll={longpoll}
        websocket={websocket}
      />
    </WidgetShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Canvas                                  */
/* -------------------------------------------------------------------------- */

type RowConfig = {
  label: string;
  sublabel: string;
  sim: Sim;
  protocol: "polling" | "longpoll" | "websocket";
};

function PipeCanvas({
  nowMs,
  polling,
  longpoll,
  websocket,
}: {
  nowMs: number;
  polling: Sim;
  longpoll: Sim;
  websocket: Sim;
}) {
  const WIDTH = 800;
  const ROW_H = 110;
  const ROW_GAP = 14;
  const HEIGHT = ROW_H * 3 + ROW_GAP * 2 + 42;
  const LEFT = 112;
  const RIGHT = 16;
  const TRACK_W = WIDTH - LEFT - RIGHT;
  const x = (t: number) => LEFT + Math.max(0, Math.min(DURATION_MS, t)) / DURATION_MS * TRACK_W;

  const rows: RowConfig[] = [
    { label: "polling", sublabel: `ask every ${POLL_INTERVAL_MS / 1000}s`, sim: polling, protocol: "polling" },
    { label: "long polling", sublabel: "ask once · reply when there's news", sim: longpoll, protocol: "longpoll" },
    { label: "WebSocket", sublabel: "upgrade once · socket stays open", sim: websocket, protocol: "websocket" },
  ];

  // Keep the SVG at its intrinsic size so 9-10pt labels stay readable at every
  // width. Below ~800 CSS px the outer overflow-x scroll lets the reader drag
  // the canvas horizontally — preferred over proportionally shrinking text
  // into illegibility. DESIGN.md §7 note: canvas > label chrome.
  return (
    <div
      style={{
        overflowX: "auto",
        overflowY: "hidden",
        maxWidth: "100%",
      }}
    >
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      style={{ maxWidth: "100%", minWidth: 560, height: "auto", display: "block" }}
      role="img"
      aria-label={`Three protocols compared at t = ${(nowMs / 1000).toFixed(1)}s`}
    >
      {rows.map((row, i) => {
        const y = i * (ROW_H + ROW_GAP) + 10;
        return (
          <ProtocolRow
            key={row.protocol}
            row={row}
            x0={LEFT}
            w={TRACK_W}
            y={y}
            h={ROW_H}
            nowMs={nowMs}
            xOfT={x}
          />
        );
      })}

      {/* Shared time axis at the bottom */}
      <g transform={`translate(0, ${HEIGHT - 24})`}>
        {[0, 2, 4, 6, 8, 10].map((sec) => {
          const px = x(sec * 1000);
          return (
            <g key={sec}>
              <line
                x1={px}
                x2={px}
                y1={-4}
                y2={0}
                stroke="var(--color-rule)"
                strokeWidth={1}
              />
              <text
                x={px}
                y={12}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fill="var(--color-text-muted)"
              >
                {sec}s
              </text>
            </g>
          );
        })}
      </g>

      {/* Global playhead across all rows. No transition — the rAF loop already
          updates nowMs 60×/s, so interpolation adds lag instead of smoothness. */}
      <line
        x1={x(nowMs)}
        x2={x(nowMs)}
        y1={8}
        y2={HEIGHT - 28}
        stroke="var(--color-accent)"
        strokeWidth={1.2}
        strokeDasharray="4 3"
        opacity={0.5}
      />
    </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  One row                                   */
/* -------------------------------------------------------------------------- */

function ProtocolRow({
  row,
  x0,
  w,
  y,
  h,
  nowMs,
  xOfT,
}: {
  row: RowConfig;
  x0: number;
  w: number;
  y: number;
  h: number;
  nowMs: number;
  xOfT: (t: number) => number;
}) {
  const BROWSER_Y = y + 24;
  const SERVER_Y = y + 88;

  return (
    <g>
      {/* Row backdrop */}
      <rect
        x={0}
        y={y}
        width={x0 + w + 20}
        height={h}
        rx={4}
        fill="transparent"
      />

      {/* Label + stats */}
      <text
        x={8}
        y={y + 20}
        fontFamily="var(--font-sans)"
        fontSize={13}
        fontWeight={500}
        fill="var(--color-text)"
      >
        {row.label}
      </text>
      <text
        x={8}
        y={y + 36}
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--color-text-muted)"
      >
        {row.sublabel}
      </text>

      <StatsBlock x={8} y={y + 58} stats={row.sim.stats} protocol={row.protocol} nowMs={nowMs} />

      {/* Two lifelines */}
      <text
        x={x0 - 8}
        y={BROWSER_Y + 3}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--color-text-muted)"
      >
        browser
      </text>
      <text
        x={x0 - 8}
        y={SERVER_Y + 3}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--color-text-muted)"
      >
        server
      </text>
      <line
        x1={x0}
        x2={x0 + w}
        y1={BROWSER_Y}
        y2={BROWSER_Y}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      <line
        x1={x0}
        x2={x0 + w}
        y1={SERVER_Y}
        y2={SERVER_Y}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />

      {/* Events: stars on the server lifeline (only those that have fired) */}
      {EVENTS_MS.filter((e) => e <= nowMs).map((e) => (
        <g key={`evt-${row.protocol}-${e}`} transform={`translate(${xOfT(e)}, ${SERVER_Y})`}>
          <circle
            r={3.2}
            cx={0}
            cy={0}
            fill="var(--color-accent)"
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

      {/* Held-request span (long-poll only) */}
      {row.sim.heldSpan ? (
        <HeldSpan
          x1={xOfT(row.sim.heldSpan.from)}
          x2={xOfT(row.sim.heldSpan.to)}
          y1={BROWSER_Y}
          y2={SERVER_Y}
        />
      ) : null}

      {/* For long-poll: the past held spans (between req and dataRes pairs) */}
      {row.protocol === "longpoll" &&
        row.sim.messages
          .filter((m) => m.held)
          .map((m, i) => (
            <HeldSpan
              key={`held-${i}`}
              x1={xOfT(m.tStart)}
              x2={xOfT(m.tEnd)}
              y1={BROWSER_Y}
              y2={SERVER_Y}
              faded
            />
          ))}

      {/* WebSocket: thick persistent pipe after handshake */}
      {row.protocol === "websocket" && nowMs >= WS_HANDSHAKE_MS ? (
        <line
          x1={xOfT(WS_HANDSHAKE_MS)}
          x2={xOfT(nowMs)}
          y1={(BROWSER_Y + SERVER_Y) / 2}
          y2={(BROWSER_Y + SERVER_Y) / 2}
          stroke="var(--color-accent)"
          strokeWidth={3}
          opacity={0.75}
        />
      ) : null}

      {/* Messages — key by protocol + tStart + kind so each message has a
          stable identity across re-renders, and new messages mount fresh so
          the scale-from-0.6 entry animation fires exactly when they appear. */}
      {row.sim.messages.map((m) =>
        m.held ? null : (
          <MessageArrow
            key={`m-${row.protocol}-${m.kind}-${m.tStart}-${m.tEnd}`}
            m={m}
            xOfT={xOfT}
            browserY={BROWSER_Y}
            serverY={SERVER_Y}
            nowMs={nowMs}
          />
        ),
      )}
    </g>
  );
}

function HeldSpan({
  x1,
  x2,
  y1,
  y2,
  faded = false,
}: {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  faded?: boolean;
}) {
  return (
    <rect
      x={x1}
      y={y1 + 2}
      width={Math.max(1, x2 - x1)}
      height={y2 - y1 - 4}
      fill={faded
        ? "color-mix(in oklab, var(--color-text-muted) 8%, transparent)"
        : "color-mix(in oklab, var(--color-accent) 10%, transparent)"}
      stroke={faded ? "var(--color-text-muted)" : "var(--color-accent)"}
      strokeWidth={0.8}
      strokeDasharray={faded ? "3 3" : undefined}
      opacity={faded ? 0.55 : 0.8}
    />
  );
}

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
  const opacity =
    m.kind === "emptyRes" ? 0.55 : isRecent ? 1 : 0.78;
  const strokeWidth = isRecent ? 1.8 : 1.1;

  const x1 = xOfT(m.tStart);
  const x2 = xOfT(m.tEnd);
  const y1 = m.dir === "down" ? browserY : serverY;
  const y2 = m.dir === "down" ? serverY : browserY;

  // Each message is keyed by its protocol + time so new messages mount when
  // the playhead crosses tEnd; React treats them as fresh and motion/react
  // runs the `initial → animate` transition. That pop — from opacity 0 and a
  // slight scale-from-0.6 — is the teaching signal: "this byte appeared on
  // the wire now, it wasn't here 40 ms ago." Prior: static `initial={false}`.
  const originX = (x1 + x2) / 2;
  const originY = (y1 + y2) / 2;

  // For instantaneous pulses, draw a vertical arrow at x1=x2
  if (Math.abs(m.tStart - m.tEnd) < 4) {
    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity, scale: 1 }}
        transition={SPRING.snappy}
        style={{ transformOrigin: `${originX}px ${originY}px`, transformBox: "view-box" }}
      >
        <line
          x1={x1}
          x2={x2}
          y1={y1}
          y2={y2}
          stroke={baseColor}
          strokeWidth={strokeWidth}
        />
        {/* Arrow head */}
        <path
          d={arrowHeadPath(x2, y2, m.dir === "down" ? "down" : "up")}
          fill={baseColor}
        />
        {/* Labels only for recent messages */}
        {isRecent ? (
          <text
            x={x1 + 4}
            y={(y1 + y2) / 2}
            fontFamily="var(--font-mono)"
            fontSize={8}
            fill={baseColor}
          >
            {labelFor(m.kind)}
          </text>
        ) : null}
      </motion.g>
    );
  }

  // Slanted line for timed messages
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity, scale: 1 }}
      transition={SPRING.snappy}
      style={{ transformOrigin: `${originX}px ${originY}px`, transformBox: "view-box" }}
    >
      <line
        x1={x1}
        x2={x2}
        y1={y1}
        y2={y2}
        stroke={baseColor}
        strokeWidth={strokeWidth}
      />
      <path d={arrowHeadPath(x2, y2, m.dir === "down" ? "down" : "up")} fill={baseColor} />
    </motion.g>
  );
}

function labelFor(kind: Msg["kind"]): string {
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
/*                                  Stats block                               */
/* -------------------------------------------------------------------------- */

function StatsBlock({
  x,
  y,
  stats,
  protocol,
  nowMs,
}: {
  x: number;
  y: number;
  stats: Stats;
  protocol: RowConfig["protocol"];
  nowMs: number;
}) {
  const bytes =
    stats.bytesSent >= 1000
      ? `${(stats.bytesSent / 1000).toFixed(1)} KB`
      : `${stats.bytesSent} B`;
  const maxDelta =
    stats.worstLatencyMs > 0 ? `${stats.worstLatencyMs}ms` : "—";
  const eventsLabel =
    protocol === "polling"
      ? `polls: ${stats.reqs}`
      : protocol === "longpoll"
        ? `cycles: ${stats.reqs}`
        : `frames: ${stats.eventsDelivered}`;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <text
        x={0}
        y={0}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        {eventsLabel}
      </text>
      <text
        x={0}
        y={14}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text)"
      >
        bytes: {bytes}
      </text>
      <text
        x={0}
        y={28}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill={stats.worstLatencyMs > 500 ? "var(--color-accent)" : "var(--color-text-muted)"}
      >
        max Δ: {maxDelta}
      </text>
      {/* Touch nowMs so this re-renders on each frame. */}
      <rect x={0} y={0} width={1} height={1} fill="transparent" opacity={0} pointerEvents="none">
        <title>{`t=${nowMs}`}</title>
      </rect>
    </g>
  );
}
