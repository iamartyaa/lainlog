"use client";

import { memo, useMemo, useState } from "react";
import { Scrubber } from "@/components/viz/Scrubber";
import { TextHighlighter } from "@/components/fancy";
import { WidgetShell } from "@/components/viz/WidgetShell";
import {
  classify,
  ClassifiedEvent,
  DURATION_MS,
  EVENT_TIMES_MS,
  TwoRowCanvas,
} from "./_reconnect-shared";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

const FIXED_GAP_MS = 1600;

const MemoTwoRowCanvas = memo(TwoRowCanvas);

/**
 * DropTiming — §5 reconnect widget. One verb (slide the cliff), one teaching
 * claim: where the dropout starts decides which side of the cliff each
 * event lives on. Gap duration is fixed at 1.6s; only the start slides.
 *
 * Visual distinctness affordance (B5): the dropout band's LEFT edge carries
 * a 1px terracotta tick + `cliff` label rising 8px above the WS row. The
 * right edge is plain — gap is fixed in this widget, so it doesn't earn an
 * annotation.
 */
export function DropTiming() {
  const [dropAt, setDropAt] = useState(3500);
  const dropEnd = Math.min(dropAt + FIXED_GAP_MS, DURATION_MS);

  const classified: ClassifiedEvent[] = useMemo(
    () =>
      EVENT_TIMES_MS.map((t, idx) => ({
        id: idx + 1,
        t,
        ...classify(t, dropAt, dropEnd),
      })),
    [dropAt, dropEnd],
  );

  const wsLost = classified.filter((e) => e.ws.kind === "lost").length;
  const sseReplayed = classified.filter((e) => e.sse.kind === "replayed").length;

  const lastBeforeDrop = classified.filter((e) => e.t < dropAt).slice(-1)[0];
  const lastSseId = lastBeforeDrop?.id ?? 0;

  return (
    <WidgetShell
      title="dropout · which side of the cliff"
      measurements={`WS lost: ${wsLost} · SSE replayed: ${sseReplayed}`}
      state={
        <>
          <TextHighlighter
            triggerType="auto"
            transition={HL_TX}
            highlightColor={HL_COLOR}
            className="rounded-[0.2em] px-[1px]"
          >
            Drag the cliff
          </TextHighlighter>{" "}
          where the network drops. WebSocket loses every event past the
          cliff; SSE replays them all when the connection heals.
        </>
      }
      canvas={
        <>
          <div className="bs-rg-narrow">
            <MemoTwoRowCanvas
              classified={classified}
              dropAt={dropAt}
              dropEnd={dropEnd}
              lastSseId={lastSseId}
              variant="narrow"
              scrubbedEdge="left"
            />
          </div>
          <div className="bs-rg-wide">
            <MemoTwoRowCanvas
              classified={classified}
              dropAt={dropAt}
              dropEnd={dropEnd}
              lastSseId={lastSseId}
              variant="wide"
              scrubbedEdge="left"
            />
          </div>
        </>
      }
      controls={
        <Scrubber
          label="drop@"
          value={dropAt}
          min={400}
          max={DURATION_MS - 1400}
          step={100}
          onChange={setDropAt}
          format={(v) => `${(v / 1000).toFixed(1)}s`}
        />
      }
    />
  );
}
