"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { TextHighlighter } from "@/components/fancy";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";
import { playSound } from "@/lib/audio";
import { WidgetShell } from "./WidgetShell";
import { ProtocolCanvas, StatLine, usePlayClock } from "./_pipe-canvas";
import { DURATION_MS, simWebSocket } from "./_pipe-sim";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

/**
 * WebSocketStream — §3 protocol widget. One verb, one claim: pay once at the
 * handshake, then the socket carries every event for ~14 bytes a piece. The
 * persistent terracotta pipe along the wire is the teaching artefact —
 * polling and long-poll never get one of those.
 */
export function WebSocketStream() {
  const { nowMs, playing, toggle } = usePlayClock();
  const sim = useMemo(() => simWebSocket(nowMs), [nowMs]);
  const tap = useTapPulse<HTMLButtonElement>();

  const onClick = () => {
    playSound("Progress-Tick");
    tap.pulse();
    toggle();
  };

  return (
    <WidgetShell
      title="websocket · 10s window"
      measurements={
        nowMs >= DURATION_MS
          ? `${sim.stats.eventsDelivered} frames · ${sim.stats.bytesSent} B · max Δ ${sim.stats.worstLatencyMs} ms`
          : `t = ${(nowMs / 1000).toFixed(1)}s of ${DURATION_MS / 1000}s`
      }
      captionTone="prominent"
      caption={
        <>
          <TextHighlighter
            triggerType="auto"
            transition={HL_TX}
            highlightColor={HL_COLOR}
            className="rounded-[0.2em] px-[1px]"
          >
            Press play
          </TextHighlighter>{" "}
          and watch the handshake finish, then three frames ride the open
          socket. No more requests after the first.
        </>
      }
      controls={
        <div className="flex flex-wrap items-center gap-[var(--spacing-md)]">
          <motion.button
            ref={tap.ref}
            type="button"
            onClick={onClick}
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
          <StatLine protocol="websocket" stats={sim.stats} />
        </div>
      }
    >
      <div className="bs-pc-narrow">
        <ProtocolCanvas
          protocol="websocket"
          sim={sim}
          nowMs={nowMs}
          authoredWidth={340}
        />
      </div>
      <div className="bs-pc-wide">
        <ProtocolCanvas
          protocol="websocket"
          sim={sim}
          nowMs={nowMs}
          authoredWidth={680}
        />
      </div>
    </WidgetShell>
  );
}
