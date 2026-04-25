"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { PRESS, SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type ScenarioId = "hot" | "warm" | "cold";

type Scenario = {
  id: ScenarioId;
  label: string;
  near: "hit" | "miss";
  dist: "hit" | "miss";
  /** Step at which the request exits. -1 means it falls through to bloom. */
};

const SCENARIOS: Scenario[] = [
  { id: "hot", label: "hot — same shard just checked", near: "hit", dist: "hit" },
  { id: "warm", label: "warm — different shard saw it", near: "miss", dist: "hit" },
  { id: "cold", label: "cold — never seen anywhere", near: "miss", dist: "miss" },
];

type StepInfo = {
  caption: string;
  /** Which lane is the current focus: 0 = entering, 1 = near-cache, 2 = dist-cache, 3 = exit. */
  focus: 0 | 1 | 2 | 3;
};

function stepsFor(s: Scenario): StepInfo[] {
  const steps: StepInfo[] = [
    {
      focus: 0,
      caption: "The request arrives at the identity frontend. The canonical email is what gets looked up — not what was typed.",
    },
    {
      focus: 1,
      caption:
        s.near === "hit"
          ? "Near-cache hit. This shard answered the same question seconds ago. The result is in process memory; no further work is needed."
          : "Near-cache miss. Nothing recent for this email on this shard. The server asks the distributed tier next.",
    },
  ];
  if (s.near === "hit") {
    steps.push({
      focus: 3,
      caption:
        "Request exits at the near-cache. Microseconds. The fastest possible path — never touches the distributed tier or the database.",
    });
    return steps;
  }
  steps.push({
    focus: 2,
    caption:
      s.dist === "hit"
        ? "Distributed-cache hit. Some other shard saw this email recently and stashed the answer where everyone can read it."
        : "Distributed-cache miss too. No one's seen this email recently, anywhere. The request falls through to the next layer — the Bloom filter.",
  });
  steps.push({
    focus: 3,
    caption:
      s.dist === "hit"
        ? "Request exits at the distributed cache. A millisecond or two — still fast, still no database trip."
        : "Both caches missed. The next stop is the Bloom filter (in the next section). Only Bloom or Spanner can answer now.",
  });
  return steps;
}

type Props = { initialScenario?: ScenarioId };

/**
 * CacheTier — three scenarios, each walking through the two cache lookups
 * before any "real" work happens. Teaches that the answer often comes from
 * memory, not the database. Mobile-first 360-unit canvas; the lookup boxes
 * never resize across scenarios because every box is authored at full size.
 */
export function CacheTier({ initialScenario = "hot" }: Props) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenario);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const steps = useMemo(() => stepsFor(scenario), [scenario]);

  const [step, setStep] = useState(0);
  const clamped = Math.max(0, Math.min(step, steps.length - 1));
  const focus = steps[clamped].focus;

  // Geometry — 360 wide.
  const WIDTH = 360;
  const PAD = 14;
  const ENTRY_Y = 18;
  const ENTRY_H = 32;
  const NEAR_Y = ENTRY_Y + ENTRY_H + 18;
  const NEAR_H = 50;
  const DIST_Y = NEAR_Y + NEAR_H + 14;
  const DIST_H = 50;
  const EXIT_Y = DIST_Y + DIST_H + 16;
  const EXIT_H = 30;
  const HEIGHT = EXIT_Y + EXIT_H + 14;

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
    const tone =
      isFocus
        ? "var(--color-accent)"
        : stateRevealed
          ? "var(--color-text)"
          : "var(--color-rule)";

    return (
      <motion.g
        initial={false}
        animate={{ opacity: stateRevealed || isFocus ? 1 : 0.45 }}
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
        {/* state stamp on the right */}
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

  const handleStep = useCallback((next: number) => setStep(next), []);

  return (
    <WidgetShell
      title="cache tier · where the answer comes from"
      caption={steps[clamped].caption}
      captionTone="prominent"
      controls={
        <div className="flex flex-col items-center gap-[var(--spacing-sm)] w-full">
          <WidgetNav value={clamped} total={steps.length} onChange={handleStep} />
          <div
            className="flex flex-col gap-[var(--spacing-2xs)] font-sans"
            style={{ fontSize: "var(--text-ui)" }}
          >
            <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-small)" }}>
              scenario
            </span>
            <div className="flex flex-wrap items-center gap-x-[var(--spacing-2xs)]" style={{ minHeight: 44 }}>
              {SCENARIOS.map((s, i) => {
                const active = scenarioId === s.id;
                return (
                  <span key={s.id} className="flex items-center">
                    {i > 0 ? (
                      <span
                        aria-hidden
                        className="mx-[var(--spacing-2xs)]"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        ·
                      </span>
                    ) : null}
                    <motion.button
                      type="button"
                      onClick={() => {
                        setScenarioId(s.id);
                        setStep(0);
                      }}
                      aria-pressed={active}
                      aria-label={`scenario: ${s.label}`}
                      className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center hover:text-[color:var(--color-accent)]"
                      style={{
                        color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                        textDecoration: active ? "underline" : "none",
                      }}
                      {...PRESS}
                    >
                      {s.label}
                    </motion.button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`Cache-tier walk. Scenario: ${scenario.label}. Step ${clamped + 1} of ${steps.length}.`}
      >
        {/* Entry strip */}
        <motion.g
          initial={false}
          animate={{ opacity: focus === 0 ? 1 : 0.6 }}
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
        </motion.g>

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

        {tileFor(1, NEAR_Y, NEAR_H, "near-cache", "in-process · per-shard", scenario.near)}

        {/* Connector to dist (only meaningful if near missed) */}
        <line
          x1={WIDTH / 2}
          y1={NEAR_Y + NEAR_H}
          x2={WIDTH / 2}
          y2={DIST_Y}
          stroke={
            scenario.near === "miss"
              ? "var(--color-text-muted)"
              : "var(--color-text-muted)"
          }
          strokeWidth={1}
          opacity={scenario.near === "miss" ? 0.6 : 0.18}
        />

        {tileFor(2, DIST_Y, DIST_H, "distributed cache", "Memcache-class · cross-shard", scenario.dist)}

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
            strokeDasharray={focus === 3 && scenario.near === "miss" && scenario.dist === "miss" ? "4 3" : undefined}
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
            {scenario.near === "hit"
              ? "answer (~µs)"
              : scenario.dist === "hit"
                ? "answer (~1–2 ms)"
                : "→ continue to bloom filter"}
          </text>
        </motion.g>
      </svg>
    </WidgetShell>
  );
}
