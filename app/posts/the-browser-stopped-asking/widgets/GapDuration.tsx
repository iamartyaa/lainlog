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

const FIXED_DROP_AT_MS = 3500;

const MemoTwoRowCanvas = memo(TwoRowCanvas);

/**
 * GapDuration — §5 reconnect widget. One verb (stretch the gap), one
 * teaching claim: hold the drop time fixed and stretch how long the
 * outage lasts; SSE's replay arc grows; WebSocket's loss count grows
 * with it but nothing comes back.
 *
 * Visual distinctness affordance (B5): the dropout band's RIGHT edge
 * carries a 1px terracotta tick + `gap end` label rising above the WS
 * row. The left edge is plain — pinned in this widget. Mirror of
 * DropTiming, so adjacent canvases read unambiguously different.
 */
export function GapDuration() {
  const [dropMs, setDropMs] = useState(2200);
  const dropEnd = Math.min(FIXED_DROP_AT_MS + dropMs, DURATION_MS);

  const classified: ClassifiedEvent[] = useMemo(
    () =>
      EVENT_TIMES_MS.map((t, idx) => ({
        id: idx + 1,
        t,
        ...classify(t, FIXED_DROP_AT_MS, dropEnd),
      })),
    [dropEnd],
  );

  const replayedIds = classified
    .filter((e) => e.sse.kind === "replayed")
    .map((e) => `evt-${e.id}`);

  const lastBeforeDrop = classified.filter((e) => e.t < FIXED_DROP_AT_MS).slice(-1)[0];
  const lastSseId = lastBeforeDrop?.id ?? 0;

  const replayLabel =
    replayedIds.length === 0
      ? "replay: none"
      : replayedIds.length === 1
        ? `replay: ${replayedIds[0]}`
        : `replay: ${replayedIds[0]}..${replayedIds[replayedIds.length - 1]}`;

  return (
    <WidgetShell
      title="gap length · how much SSE has to replay"
      measurements={`gap: ${(dropMs / 1000).toFixed(1)}s · ${replayLabel}`}
      state={
        <>
          <TextHighlighter
            triggerType="auto"
            transition={HL_TX}
            highlightColor={HL_COLOR}
            className="rounded-[0.2em] px-[1px]"
          >
            Stretch the gap
          </TextHighlighter>{" "}
          and watch SSE&apos;s replay arc grow as more events fall inside.
          WebSocket&apos;s loss count grows too — nothing comes back.
        </>
      }
      canvas={
        <>
          <div className="bs-rg-narrow">
            <MemoTwoRowCanvas
              classified={classified}
              dropAt={FIXED_DROP_AT_MS}
              dropEnd={dropEnd}
              lastSseId={lastSseId}
              variant="narrow"
              scrubbedEdge="right"
            />
          </div>
          <div className="bs-rg-wide">
            <MemoTwoRowCanvas
              classified={classified}
              dropAt={FIXED_DROP_AT_MS}
              dropEnd={dropEnd}
              lastSseId={lastSseId}
              variant="wide"
              scrubbedEdge="right"
            />
          </div>
        </>
      }
      controls={
        <Scrubber
          label="for"
          value={dropMs}
          min={400}
          max={4500}
          step={100}
          onChange={setDropMs}
          format={(v) => `${(v / 1000).toFixed(1)}s`}
        />
      }
    />
  );
}
