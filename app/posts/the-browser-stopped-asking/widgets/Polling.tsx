"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { TextHighlighter } from "@/components/fancy";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";
import { playSound } from "@/lib/audio";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { ProtocolCanvas, StatLine, usePlayClock } from "./_pipe-canvas";
import { DURATION_MS, simPolling } from "./_pipe-sim";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

/**
 * Polling — §3 protocol widget. One verb (press play), one teaching claim:
 * polling burns most of its bytes saying nothing. Stats land at
 * 60 polls · ~7.5 KB · max Δ ≈ 600 ms after the 10-second window completes.
 */
export function Polling() {
  const { nowMs, playing, toggle } = usePlayClock();
  const sim = useMemo(() => simPolling(nowMs), [nowMs]);
  const tap = useTapPulse<HTMLButtonElement>();

  const onClick = () => {
    playSound("Progress-Tick");
    tap.pulse();
    toggle();
  };

  return (
    <WidgetShell
      title="polling · 10s window"
      measurements={
        nowMs >= DURATION_MS
          ? `${sim.stats.reqs} polls · ${(sim.stats.bytesSent / 1000).toFixed(1)} KB · max Δ ${sim.stats.worstLatencyMs} ms`
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
          and watch sixty requests carry three pieces of news. Most replies
          carry nothing.
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
          <StatLine protocol="polling" stats={sim.stats} />
        </div>
      }
    >
      <div className="bs-pc-narrow">
        <ProtocolCanvas
          protocol="polling"
          sim={sim}
          nowMs={nowMs}
          authoredWidth={340}
        />
      </div>
      <div className="bs-pc-wide">
        <ProtocolCanvas
          protocol="polling"
          sim={sim}
          nowMs={nowMs}
          authoredWidth={680}
        />
      </div>
    </WidgetShell>
  );
}
