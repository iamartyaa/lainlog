"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Stepper } from "@/components/viz/Stepper";
import { PRESS, SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type StageId =
  | "input"
  | "edge"
  | "frontend"
  | "normalise"
  | "nearCache"
  | "distCache"
  | "bloom"
  | "spanner"
  | "respond";

type BranchId = "nearCacheHit" | "distCacheHit" | "bloomNo";

type Scenario = {
  id: "fresh" | "hotTaken" | "dottedCold";
  label: string;
  typed: string;
  canonical: string;
  /** Which branch exits early (if any). undefined means no fast-path; the flow reaches Spanner. */
  earlyExit?: BranchId;
  /** Final answer. */
  finalAnswer: "available" | "taken";
};

const SCENARIOS: Scenario[] = [
  {
    id: "fresh",
    label: "brand-new email",
    typed: "zxcvb12345@gmail.com",
    canonical: "zxcvb12345@gmail.com",
    earlyExit: "bloomNo",
    finalAnswer: "available",
  },
  {
    id: "hotTaken",
    label: "someone just checked this name",
    typed: "johndoe@gmail.com",
    canonical: "johndoe@gmail.com",
    earlyExit: "nearCacheHit",
    finalAnswer: "taken",
  },
  {
    id: "dottedCold",
    label: "dotted variant, nothing cached",
    typed: "J.ohn.Doe+promo@gmail.com",
    canonical: "johndoe@gmail.com",
    earlyExit: undefined,
    finalAnswer: "taken",
  },
];

type Stage = {
  id: StageId;
  label: string;
  sublabel?: string;
  /** Caption shown below canvas when this stage is active. */
  caption: (s: Scenario) => string;
  /** If this stage can short-circuit, the branch id + label. */
  branch?: { id: BranchId; label: string; to: (s: Scenario) => string };
};

const TRUNK_STAGES: Stage[] = [
  {
    id: "input",
    label: "you type the email",
    caption: (s) =>
      `The browser has the full string ${s.typed} once you pause for ~300 ms. It doesn't fire one request per keystroke.`,
  },
  {
    id: "edge",
    label: "Google Front End",
    sublabel: "Maglev + GFE + abuse",
    caption: () =>
      "The request arrives at the closest Google edge. Maglev routes the TCP flow, GFE terminates TLS, and Cloud-Armor-class rules cap abuse and feed a reCAPTCHA score in.",
  },
  {
    id: "frontend",
    label: "identity frontend shard",
    sublabel: "ALTS over Stubby · Slicer",
    caption: () =>
      "An internal RPC routes to a specific Gaia frontend. Slicer hashes on the canonical email so the same address always lands on the same warm shard.",
  },
  {
    id: "normalise",
    label: "normalise → canonical",
    caption: (s) =>
      s.typed === s.canonical
        ? `The server looks at ${s.canonical}. It's already canonical, so nothing to rewrite.`
        : `The server rewrites ${s.typed} into ${s.canonical}: lowercase, dots stripped, +tag discarded. This canonical string is what every layer below actually sees.`,
  },
  {
    id: "nearCache",
    label: "in-process near-cache",
    sublabel: "hot entries, per-shard",
    caption: (s) =>
      s.earlyExit === "nearCacheHit"
        ? `The cache hits. This email was asked about recently on the same shard — the answer is already in memory. The server responds without touching the distributed tier or the database.`
        : `The cache misses. Nothing recent for this canonical email on this shard. The server asks the distributed cache next.`,
    branch: {
      id: "nearCacheHit",
      label: "hit",
      to: (s) => s.finalAnswer,
    },
  },
  {
    id: "distCache",
    label: "distributed cache",
    sublabel: "Memcache-class (not Redis)",
    caption: (s) =>
      s.earlyExit === "distCacheHit"
        ? `The distributed cache hits. Another shard saw this email recently and stashed the answer. The server responds.`
        : `The distributed cache misses. No one's seen this email recently, anywhere. The server asks the Bloom filter next.`,
    branch: {
      id: "distCacheHit",
      label: "hit",
      to: (s) => s.finalAnswer,
    },
  },
  {
    id: "bloom",
    label: "Bloom filter",
    sublabel: "in-memory pre-check",
    caption: (s) =>
      s.earlyExit === "bloomNo"
        ? `The filter says no. One of the three hashed bits is zero — nobody with this canonical email could have been inserted. The server responds without touching the database.`
        : `The filter says maybe. All three hashed bits are on. Could be a real account, could be a coincidence. The server asks the database.`,
    branch: {
      id: "bloomNo",
      label: "no",
      to: () => "available",
    },
  },
  {
    id: "spanner",
    label: "Spanner point read",
    sublabel: "primary-key lookup",
    caption: (s) =>
      `The server reads the row keyed on ${s.canonical}. Google's published target for Spanner point reads is under 5 ms at the median. Inside the storage engine, an SSTable-level Bloom filter avoids a disk seek if the row isn't there.`,
  },
  {
    id: "respond",
    label: "respond",
    caption: (s) => `The server returns "${s.finalAnswer}". The UI updates under your cursor.`,
  },
];

type Props = {
  initialScenario?: Scenario["id"];
  initialStep?: number;
};

/**
 * FlowDemo — the post's integrated pipeline widget. Nine stages in a vertical
 * trunk with three branch-off "respond" exits: near-cache hit, distributed
 * cache hit, and Bloom-filter "definitely not". Three scenarios each exercise
 * a different path:
 *   - fresh       → trunk to Bloom, Bloom says "no", respond fast
 *   - hotTaken    → trunk to near-cache, hit, respond fastest
 *   - dottedCold  → trunk all the way to Spanner, respond
 */
export function FlowDemo({ initialScenario = "fresh", initialStep = 0 }: Props) {
  const [scenarioId, setScenarioId] = useState<Scenario["id"]>(initialScenario);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  // Visible stages: if earlyExit fires at stage S, stop after S (drop later trunk stages).
  const visibleStages = useMemo(() => {
    if (!scenario.earlyExit) return TRUNK_STAGES;
    const exitStageIndex = TRUNK_STAGES.findIndex(
      (s) => s.branch?.id === scenario.earlyExit,
    );
    if (exitStageIndex < 0) return TRUNK_STAGES;
    return TRUNK_STAGES.slice(0, exitStageIndex + 1);
  }, [scenario.earlyExit]);

  const [step, setStep] = useState(initialStep);
  const clamped = Math.max(0, Math.min(step, visibleStages.length - 1));
  const current = visibleStages[clamped];

  // Layout
  const WIDTH = 820;
  const TOP_PAD = 16;
  const NODE_W = 280;
  const NODE_H = 50;
  const ROW_GAP = 22;
  const TRUNK_X = 160;
  const BRANCH_X = TRUNK_X + NODE_W + 60;
  const BRANCH_W = 240;

  const rowY = (i: number) => TOP_PAD + i * (NODE_H + ROW_GAP);

  // Height: we render ALL TRUNK_STAGES (dimmed when not visible) so the geometry stays stable.
  const totalRows = TRUNK_STAGES.length;
  const HEIGHT = TOP_PAD + totalRows * (NODE_H + ROW_GAP) + 24;

  const visibleIds = new Set(visibleStages.map((s) => s.id));
  const isActive = (id: StageId) => current.id === id;
  const isPast = (id: StageId) => {
    const i = visibleStages.findIndex((s) => s.id === id);
    return i >= 0 && i < clamped;
  };
  const isVisible = (id: StageId) => visibleIds.has(id);

  const answerTone =
    scenario.finalAnswer === "available" ? "var(--color-accent)" : "var(--color-text)";

  // Detect whether the current stage triggered the early exit (to show the branch arrow)
  const branchFired = (stg: Stage): boolean => {
    return (
      !!stg.branch &&
      scenario.earlyExit === stg.branch.id &&
      // Branch only after reader reaches that stage
      (clamped >= TRUNK_STAGES.findIndex((s) => s.id === stg.id))
    );
  };

  return (
    <WidgetShell
      title="FlowDemo · end-to-end"
      measurements={`scenario = ${scenario.label} · step = ${clamped + 1}/${visibleStages.length}`}
      caption={current.caption(scenario)}
      controls={
        <div className="flex items-center gap-[var(--spacing-md)] flex-wrap">
          <Stepper value={clamped} total={visibleStages.length} onChange={setStep} />
          <div
            className="flex items-center gap-[var(--spacing-2xs)] font-sans"
            style={{ fontSize: "var(--text-ui)" }}
          >
            {SCENARIOS.map((s, i) => {
              const active = scenarioId === s.id;
              return (
                <span key={s.id} className="flex items-center">
                  {i > 0 ? (
                    <span className="mx-1" style={{ color: "var(--color-text-muted)" }}>
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
                    className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] transition-colors hover:text-[color:var(--color-accent)] inline-flex items-center gap-[var(--spacing-2xs)]"
                    style={{
                      color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                      textDecoration: active ? "underline" : "none",
                    }}
                    {...PRESS}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: 1,
                        background: active ? "var(--color-accent)" : "transparent",
                        border: active ? "none" : "1px solid var(--color-rule)",
                      }}
                    />
                    {s.label}
                  </motion.button>
                </span>
              );
            })}
          </div>
        </div>
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
        role="img"
        aria-label={`Flow demo, scenario: ${scenario.label}, step ${clamped + 1}: ${current.label}`}
      >
        {/* Trunk: render every stage (grey out the ones not visible this scenario) */}
        {TRUNK_STAGES.map((stg, i) => {
          const y = rowY(i);
          const active = isActive(stg.id);
          const past = isPast(stg.id);
          const vis = isVisible(stg.id);
          const opacity = vis ? (active ? 1 : past ? 0.9 : 0.6) : 0.22;
          const borderColor = active
            ? "var(--color-accent)"
            : past
              ? "var(--color-text-muted)"
              : "var(--color-rule)";

          // Bracket shape for the branch-capable stages (nearCache/distCache/bloom) — small indicator on the right edge
          return (
            <motion.g
              key={stg.id}
              initial={false}
              animate={{ opacity }}
              transition={SPRING.smooth}
            >
              <rect
                x={TRUNK_X}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={3}
                fill={
                  active
                    ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                    : past
                      ? "color-mix(in oklab, var(--color-surface) 60%, transparent)"
                      : "transparent"
                }
                stroke={borderColor}
                strokeWidth={active ? 1.6 : 1}
              />
              <text
                x={TRUNK_X + 14}
                y={y + (stg.sublabel ? 20 : NODE_H / 2)}
                dominantBaseline={stg.sublabel ? "central" : "central"}
                fontFamily="var(--font-sans)"
                fontSize={13}
                fill={active || past ? "var(--color-text)" : "var(--color-text-muted)"}
              >
                {stg.label}
              </text>
              {stg.sublabel ? (
                <text
                  x={TRUNK_X + 14}
                  y={y + 36}
                  fontFamily="var(--font-mono)"
                  fontSize={10}
                  fill="var(--color-text-muted)"
                >
                  {stg.sublabel}
                </text>
              ) : null}

              {/* Downstream edge (vertical line between trunk nodes). Only draw if next stage is visible. */}
              {i < TRUNK_STAGES.length - 1 && isVisible(TRUNK_STAGES[i + 1].id) ? (
                <line
                  x1={TRUNK_X + NODE_W / 2}
                  x2={TRUNK_X + NODE_W / 2}
                  y1={y + NODE_H}
                  y2={y + NODE_H + ROW_GAP}
                  stroke="var(--color-text-muted)"
                  strokeWidth={1.2}
                  opacity={0.5}
                />
              ) : null}
            </motion.g>
          );
        })}

        {/* Branch-out nodes — rendered for each stage with a branch, but only "active" when the scenario took this path. */}
        {TRUNK_STAGES.filter((s) => s.branch).map((stg, branchIdx) => {
          const trunkIdx = TRUNK_STAGES.findIndex((s) => s.id === stg.id);
          const y = rowY(trunkIdx) + NODE_H / 2 - 22;
          const fired = branchFired(stg);
          const label = stg.branch!.to(scenario);
          // 60 ms stagger on non-fired branches so they fade down in order rather than as a block.
          const staggerDelay = fired ? 0 : branchIdx * 0.06;
          return (
            <motion.g
              key={`branch-${stg.id}`}
              initial={false}
              animate={{ opacity: fired ? 1 : 0.25 }}
              transition={{ ...SPRING.smooth, delay: staggerDelay }}
            >
              {/* Arrow from trunk out to the branch box */}
              <line
                x1={TRUNK_X + NODE_W}
                y1={rowY(trunkIdx) + NODE_H / 2}
                x2={BRANCH_X}
                y2={rowY(trunkIdx) + NODE_H / 2}
                stroke={fired ? "var(--color-accent)" : "var(--color-rule)"}
                strokeWidth={fired ? 1.6 : 1}
              />
              {/* Branch label (hit / no) */}
              <text
                x={TRUNK_X + NODE_W + 32}
                y={rowY(trunkIdx) + NODE_H / 2 - 8}
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill={fired ? "var(--color-accent)" : "var(--color-text-muted)"}
              >
                {stg.branch!.label}
              </text>
              {/* Branch-out box */}
              <rect
                x={BRANCH_X}
                y={y}
                width={BRANCH_W}
                height={44}
                rx={3}
                fill={fired ? "color-mix(in oklab, var(--color-accent) 16%, transparent)" : "transparent"}
                stroke={fired ? "var(--color-accent)" : "var(--color-rule)"}
                strokeWidth={fired ? 1.6 : 1}
                strokeDasharray={fired ? undefined : "4 3"}
              />
              <text
                x={BRANCH_X + BRANCH_W / 2}
                y={y + 22}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill={fired ? "var(--color-text)" : "var(--color-text-muted)"}
              >
                {label}
              </text>
            </motion.g>
          );
        })}

        {/* Final-answer emphasis under the bottom node when scenario reaches the trunk's end */}
        {!scenario.earlyExit && clamped === visibleStages.length - 1 ? (
          <motion.g
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.2 }}
          >
            <text
              x={TRUNK_X + NODE_W / 2}
              y={HEIGHT - 6}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={13}
              fill={answerTone}
            >
              answer: <tspan fontWeight={600}>{scenario.finalAnswer}</tspan>
            </text>
          </motion.g>
        ) : null}

        {/* Canonical form label under "normalise" */}
        {(() => {
          const idx = TRUNK_STAGES.findIndex((s) => s.id === "normalise");
          if (idx < 0 || clamped < visibleStages.findIndex((s) => s.id === "normalise")) return null;
          return (
            <motion.text
              key={`can-${scenario.id}`}
              x={TRUNK_X + NODE_W / 2}
              y={rowY(idx) + NODE_H + 14}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-accent)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={SPRING.smooth}
            >
              → {scenario.canonical}
            </motion.text>
          );
        })()}
      </svg>
    </WidgetShell>
  );
}
