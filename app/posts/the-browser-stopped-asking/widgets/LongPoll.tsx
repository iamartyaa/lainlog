"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { TextHighlighter } from "@/components/fancy";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";
import { playSound } from "@/lib/audio";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { ProtocolCanvas, StatLine, usePlayClock } from "./_pipe-canvas";
import { DURATION_MS, simLongPoll } from "./_pipe-sim";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

/**
 * LongPoll — §3 protocol widget. One verb, one claim: the browser opens a
 * single request and the server holds it open until news arrives. Three
 * requests cover three events in the 10s window. The held span — that long
 * terracotta rectangle along the wire — is the visible artefact of the
 * "refusing to finish the question" move.
 */
export function LongPoll() {
  const { nowMs, playing, toggle } = usePlayClock();
  const sim = useMemo(() => simLongPoll(nowMs), [nowMs]);
  const tap = useTapPulse<HTMLButtonElement>();

  const onClick = () => {
    playSound("Progress-Tick");
    tap.pulse();
    toggle();
  };

  return (
    <WidgetShell
      title="long polling · 10s window"
      measurements={
        nowMs >= DURATION_MS
          ? `${sim.stats.reqs} requests · ${(sim.stats.bytesSent / 1000).toFixed(1)} KB · max Δ ${sim.stats.worstLatencyMs} ms`
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
          and watch three requests cover the same three events. The held
          spans are the server choosing not to reply yet.
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
          <StatLine protocol="longpoll" stats={sim.stats} />
        </div>
      }
    >
      <div className="bs-pc-narrow">
        <ProtocolCanvas
          protocol="longpoll"
          sim={sim}
          nowMs={nowMs}
          authoredWidth={340}
        />
      </div>
      <div className="bs-pc-wide">
        <ProtocolCanvas
          protocol="longpoll"
          sim={sim}
          nowMs={nowMs}
          authoredWidth={680}
        />
      </div>
    </WidgetShell>
  );
}
