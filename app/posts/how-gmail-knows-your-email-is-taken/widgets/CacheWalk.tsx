"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { PRESS, SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type LocalityId = "hot" | "warm" | "cold";

type Locality = {
  id: LocalityId;
  label: string;
  /** Hint shown on the in-canvas chip row, step 0 only. */
  hint: string;
  near: "hit" | "miss";
  dist: "hit" | "miss";
};

const LOCALITIES: Locality[] = [
  {
    id: "hot",
    label: "hot",
    hint: "same shard just checked",
    near: "hit",
    dist: "hit",
  },
  {
    id: "warm",
    label: "warm",
    hint: "different shard saw it",
    near: "miss",
    dist: "hit",
  },
  {
    id: "cold",
    label: "cold",
    hint: "never seen anywhere",
    near: "miss",
    dist: "miss",
  },
];

type StepInfo = {
  /** 0 = entering, 1 = near-cache, 2 = dist-cache, 3 = exit. */
  focus: 0 | 1 | 2 | 3;
  caption: React.ReactNode;
};

function stepsFor(loc: Locality): StepInfo[] {
  const steps: StepInfo[] = [
    {
      focus: 0,
      caption:
        "Pick the locality. It frames everything below — same shard, different shard, or nowhere.",
    },
    {
      focus: 1,
      caption:
        loc.near === "hit"
          ? "Near-cache hit. This shard answered the same question seconds ago. The result is in process memory; no further work."
          : "Near-cache miss. Nothing recent on this shard. The server asks the distributed tier next.",
    },
  ];
  if (loc.near === "hit") {
    steps.push({
      focus: 3,
      caption:
        "Exits at the near-cache. Microseconds. The fastest path — never touches the distributed tier or the database.",
    });
    return steps;
  }
  steps.push({
    focus: 2,
    caption:
      loc.dist === "hit"
        ? "Distributed-cache hit. Some other shard saw this email recently and stashed the answer where everyone can read it."
        : "Distributed-cache miss too. No one's seen this email recently, anywhere. The request falls through to the Bloom filter.",
  });
  steps.push({
    focus: 3,
    caption:
      loc.dist === "hit"
        ? "Exits at the distributed cache. A millisecond or two — still fast, still no database trip."
        : "Both caches missed. Only Bloom or Spanner can answer now.",
  });
  return steps;
}

type Props = {
  initialLocality?: LocalityId;
  initialStep?: number;
};

/**
 * CacheWalk — single widget, one verb (step). The reader picks a locality on
 * step 0 via in-canvas chips, then advances the stepper to watch where the
 * request exits. Subsequent steps lock the chips into a stamp so the locality
 * is visible but no longer interactive — keeping the controls slot single-verb
 * (interactive-components.md §4).
 *
 * Frame-stable: 4 steps, fixed canvas height, in-SVG transitions only.
 */
export function CacheWalk({
  initialLocality = "hot",
  initialStep = 0,
}: Props) {
  const [localityId, setLocalityId] = useState<LocalityId>(initialLocality);
  const locality =
    LOCALITIES.find((l) => l.id === localityId) ?? LOCALITIES[0];

  const allSteps = useMemo(() => stepsFor(locality), [locality]);
  const [step, setStep] = useState(initialStep);
  // Pin total to 4 so frame is invariant across localities (cold has 4, hot has
  // 3, warm has 4). For hot, step 2 collapses to the exit caption.
  const total = 4;
  const clamped = Math.max(0, Math.min(step, total - 1));

  // Resolve the focus/caption for `clamped` against the per-locality script.
  const resolved = useMemo<StepInfo>(() => {
    if (clamped < allSteps.length) return allSteps[clamped];
    // Hot path has only 3 entries; index 3 reuses the final exit step so the
    // walk lands on the same beat regardless of locality.
    return allSteps[allSteps.length - 1];
  }, [clamped, allSteps]);

  const focus = resolved.focus;

  // Geometry — 360 wide. Heights pinned so chip-row swap on step 0 doesn't
  // change the canvas height (chips occupy the band that the entry strip uses
  // on later steps).
  const WIDTH = 360;
  const PAD = 14;
  const ENTRY_Y = 18;
  // 44-px band so the in-canvas chip row meets the 44×44 touch-target rule
  // on step 0 and the entry strip on steps 1+ shares the same band — keeps
  // the canvas frame-stable across step transitions.
  const ENTRY_H = 44;
  const NEAR_Y = ENTRY_Y + ENTRY_H + 18;
  const NEAR_H = 50;
  const DIST_Y = NEAR_Y + NEAR_H + 14;
  const DIST_H = 50;
  const EXIT_Y = DIST_Y + DIST_H + 16;
  const EXIT_H = 30;
  const HEIGHT = EXIT_Y + EXIT_H + 14;

  const handleStep = useCallback((next: number) => setStep(next), []);

  const tileFor = (
    laneIdx: 1 | 2,
    y: number,
    h: number,
    label: string,
    sublabel: string,
    state: "hit" | "miss",
  ) => {
    const isFocus = focus === laneIdx;
    const stateRevealed =
      (laneIdx === 1 && clamped >= 1) || (laneIdx === 2 && clamped >= 2);
    const tone = isFocus
      ? "var(--color-accent)"
      : stateRevealed
        ? "var(--color-text)"
        : "var(--color-rule)";

    return (
      <motion.g
        initial={false}
        animate={{ opacity: stateRevealed || isFocus ? 1 : 0.4 }}
        transition={SPRING.smooth}
      >
        <rect
          x={PAD}
          y={y}
          width={WIDTH - PAD * 2}
          height={h}
          rx={3}
          fill={
            isFocus
              ? "color-mix(in oklab, var(--color-accent) 12%, transparent)"
              : "color-mix(in oklab, var(--color-surface) 35%, transparent)"
          }
          stroke={tone}
          strokeWidth={isFocus ? 1.6 : 1}
        />
        <text
          x={PAD + 12}
          y={y + 18}
          fontFamily="var(--font-sans)"
          fontSize={12}
          fill="var(--color-text)"
        >
          {label}
        </text>
        <text
          x={PAD + 12}
          y={y + 34}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="var(--color-text-muted)"
        >
          {sublabel}
        </text>
        {stateRevealed ? (
          <motion.g
            key={`stamp-${laneIdx}-${state}`}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={SPRING.smooth}
          >
            <rect
              x={WIDTH - PAD - 64}
              y={y + h / 2 - 12}
              width={56}
              height={24}
              rx={2}
              fill={
                state === "hit"
                  ? "color-mix(in oklab, var(--color-accent) 22%, transparent)"
                  : "transparent"
              }
              stroke={state === "hit" ? "var(--color-accent)" : "var(--color-text)"}
              strokeWidth={state === "hit" ? 1.4 : 1}
              strokeDasharray={state === "miss" ? "3 3" : undefined}
            />
            <text
              x={WIDTH - PAD - 64 + 28}
              y={y + h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill={state === "hit" ? "var(--color-accent)" : "var(--color-text)"}
              fontWeight={state === "hit" ? 600 : 400}
            >
              {state}
            </text>
          </motion.g>
        ) : null}
      </motion.g>
    );
  };

  return (
    <WidgetShell
      title="cache walk · pick a locality"
      caption={resolved.caption}
      captionTone="prominent"
      controls={
        <WidgetNav value={clamped} total={total} onChange={handleStep} />
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{
          maxWidth: WIDTH,
          height: "auto",
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label={`Cache walk. Locality: ${locality.label} — ${locality.hint}. Step ${clamped + 1} of ${total}.`}
      >
        {/* Entry / chip-picker band — same y/h on all steps so the canvas is
            frame-stable. On step 0 we render the chip picker; on steps ≥ 1 we
            render the entry strip with a locality stamp on the right. */}
        {clamped === 0 ? (
          <g>
            <text
              x={PAD}
              y={ENTRY_Y - 2}
              fontFamily="var(--font-sans)"
              fontSize={9}
              fill="var(--color-text-muted)"
              letterSpacing="0.08em"
            >
              LOCALITY
            </text>
            <foreignObject
              x={PAD}
              y={ENTRY_Y}
              width={WIDTH - PAD * 2}
              height={ENTRY_H}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--spacing-2xs)",
                  height: "100%",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-ui)",
                }}
              >
                {LOCALITIES.map((l) => {
                  const active = l.id === localityId;
                  return (
                    <motion.button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setLocalityId(l.id);
                      }}
                      aria-pressed={active}
                      aria-label={`Locality ${l.label} — ${l.hint}`}
                      style={{
                        flex: "1 1 0",
                        height: "100%",
                        minHeight: 44,
                        padding: "0 var(--spacing-2xs)",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-rule)"}`,
                        background: active
                          ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                          : "transparent",
                        color: active
                          ? "var(--color-accent)"
                          : "var(--color-text)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      {...PRESS}
                    >
                      {l.label}
                    </motion.button>
                  );
                })}
              </div>
            </foreignObject>
          </g>
        ) : (
          <motion.g
            initial={false}
            animate={{ opacity: focus === 0 ? 1 : 0.55 }}
            transition={SPRING.smooth}
          >
            <rect
              x={PAD}
              y={ENTRY_Y}
              width={WIDTH - PAD * 2}
              height={ENTRY_H}
              rx={3}
              fill="transparent"
              stroke={focus === 0 ? "var(--color-accent)" : "var(--color-rule)"}
              strokeWidth={focus === 0 ? 1.6 : 1}
            />
            <text
              x={PAD + 12}
              y={ENTRY_Y + ENTRY_H / 2}
              dominantBaseline="central"
              fontFamily="var(--font-sans)"
              fontSize={11}
              fill="var(--color-text)"
            >
              request · canonical:
              <tspan fontFamily="var(--font-mono)" fill="var(--color-accent)">
                {" "}johndoe@gmail.com
              </tspan>
            </text>
            {/* Locked locality stamp on the right */}
            <g>
              <rect
                x={WIDTH - PAD - 60}
                y={ENTRY_Y + 6}
                width={52}
                height={ENTRY_H - 12}
                rx={2}
                fill="transparent"
                stroke="var(--color-text-muted)"
                strokeWidth={1}
              />
              <text
                x={WIDTH - PAD - 34}
                y={ENTRY_Y + ENTRY_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fill="var(--color-text-muted)"
              >
                {locality.label}
              </text>
            </g>
          </motion.g>
        )}

        {/* Connector to near */}
        <line
          x1={WIDTH / 2}
          y1={ENTRY_Y + ENTRY_H}
          x2={WIDTH / 2}
          y2={NEAR_Y}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          opacity={0.5}
        />

        {tileFor(
          1,
          NEAR_Y,
          NEAR_H,
          "near-cache",
          "in-process · per-shard",
          locality.near,
        )}

        {/* Connector to dist (faded if near hit) */}
        <line
          x1={WIDTH / 2}
          y1={NEAR_Y + NEAR_H}
          x2={WIDTH / 2}
          y2={DIST_Y}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          opacity={locality.near === "miss" ? 0.6 : 0.18}
        />

        {tileFor(
          2,
          DIST_Y,
          DIST_H,
          "distributed cache",
          "Memcache-class · cross-shard",
          locality.dist,
        )}

        {/* Exit strip */}
        <motion.g
          initial={false}
          animate={{ opacity: focus === 3 ? 1 : 0.4 }}
          transition={SPRING.smooth}
        >
          <rect
            x={PAD}
            y={EXIT_Y}
            width={WIDTH - PAD * 2}
            height={EXIT_H}
            rx={3}
            fill={
              focus === 3
                ? "color-mix(in oklab, var(--color-accent) 12%, transparent)"
                : "transparent"
            }
            stroke={focus === 3 ? "var(--color-accent)" : "var(--color-rule)"}
            strokeWidth={focus === 3 ? 1.6 : 1}
            strokeDasharray={
              focus === 3 &&
              locality.near === "miss" &&
              locality.dist === "miss"
                ? "4 3"
                : undefined
            }
          />
          <text
            x={WIDTH / 2}
            y={EXIT_Y + EXIT_H / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-mono)"
            fontSize={11}
            fill={focus === 3 ? "var(--color-accent)" : "var(--color-text-muted)"}
          >
            {locality.near === "hit"
              ? "answer (~µs)"
              : locality.dist === "hit"
                ? "answer (~1–2 ms)"
                : "→ continue to bloom filter"}
          </text>
        </motion.g>
      </svg>
    </WidgetShell>
  );
}
