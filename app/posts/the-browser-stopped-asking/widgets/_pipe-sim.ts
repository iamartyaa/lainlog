/**
 * Pure-function simulators for the §3 protocol widgets.
 *
 * Three protocols, three sims. Each takes a single `nowMs` (0..DURATION_MS)
 * and returns a deterministic snapshot of the wire — messages so far, byte
 * count, and worst-case event delivery latency. The widgets don't store
 * intermediate timelines; they re-derive each frame from `nowMs`. Cheap,
 * frame-stable, no surprises on scrub.
 */

export const DURATION_MS = 10_000;

// "News" on the server — three events across the 10s window. Fixed across
// the three widgets so the reader can compare delivery deltas at a glance.
export const EVENTS_MS = [1600, 4700, 8200] as const;

// Polling knobs
export const POLL_INTERVAL_MS = 1000;
export const POLL_LATENCY_MS = 120;
export const POLL_REQ_BYTES = 520;
export const POLL_EMPTY_RES_BYTES = 140;
export const POLL_DATA_RES_BYTES = 260;

// Long-polling knobs
export const LP_LATENCY_MS = 60;
export const LP_REQ_BYTES = 520;
export const LP_RES_BYTES = 260;

// WebSocket knobs
export const WS_HANDSHAKE_MS = 140;
export const WS_HANDSHAKE_BYTES = 520;
export const WS_FRAME_BYTES = 14;
export const WS_DELIVERY_MS = 10;

export type Stats = {
  reqs: number;
  bytesSent: number;
  eventsDelivered: number;
  worstLatencyMs: number;
};

export type Msg = {
  /** t of when the message appears on the wire (start). */
  tStart: number;
  /** t of when it arrives (end). For instantaneous pulses, tEnd === tStart. */
  tEnd: number;
  /** Direction. */
  dir: "down" | "up"; // down = browser→server, up = server→browser
  kind:
    | "req"
    | "emptyRes"
    | "dataRes"
    | "frameUp"
    | "frameDown"
    | "handshakeReq"
    | "handshakeRes";
  /** An optional "span" payload (for long-poll's held request). */
  held?: boolean;
};

export type Sim = {
  stats: Stats;
  messages: Msg[];
  /** For long-poll, the *currently-held* request span, if any. */
  heldSpan?: { from: number; to: number };
};

export function simPolling(nowMs: number): Sim {
  const messages: Msg[] = [];
  let bytesSent = 0;
  let reqs = 0;
  let eventsDelivered = 0;
  let worst = 0;

  for (let start = 0; start <= nowMs; start += POLL_INTERVAL_MS) {
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

export function simLongPoll(nowMs: number): Sim {
  const messages: Msg[] = [];
  let bytesSent = 0;
  let reqs = 0;
  let eventsDelivered = 0;
  let worst = 0;
  let openedAt = 0;
  let heldSpan: Sim["heldSpan"];

  for (let i = 0; i < 40 && openedAt <= nowMs; i++) {
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

export function simWebSocket(nowMs: number): Sim {
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
