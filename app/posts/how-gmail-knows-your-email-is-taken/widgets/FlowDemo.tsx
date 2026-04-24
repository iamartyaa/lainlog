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
  earlyExit?: BranchId;
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
  caption: (s: Scenario) => string;
  branch?: { id: BranchId; label: string; to: (s: Scenario) => string };
};

const TRUNK_STAGES: Stage[] = [
  {
    id: "input",
    label: "you type the email",
    caption: (s) =>
      `The browser has the full string ${s.typed} once you pause for ~300 ms — not one request per keystroke.`,
  },
  {
    id: "edge",
    label: "Google Front End",
    sublabel: "Maglev · GFE · abuse",
    caption: () =>
      "The request arrives at the closest Google edge. Maglev routes the TCP flow, GFE terminates TLS, and Cloud-Armor-class rules cap abuse and feed a reCAPTCHA score in.",
  },
  {
    id: "frontend",
    label: "identity frontend shard",
    sublabel: "ALTS · Stubby · Slicer",
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
    sublabel: "hot entries · per shard",
    caption: (s) =>
      s.earlyExit === "nearCacheHit"
        ? `The cache hits. This email was asked about recently on the same shard — the answer is already in memory. The server responds without touching the distributed tier or the database.`
        : `The cache misses. Nothing recent for this canonical email on this shard. The server asks the distributed cache next.`,
    branch: { id: "nearCacheHit", label: "hit", to: (s) => s.finalAnswer },
  },
  {
    id: "distCache",
    label: "distributed cache",
    sublabel: "Memcache-class · not Redis",
    caption: (s) =>
      s.earlyExit === "distCacheHit"
        ? `The distributed cache hits. Another shard saw this email recently and stashed the answer. The server responds.`
        : `The distributed cache misses. No one's seen this email recently, anywhere. The server asks the Bloom filter next.`,
    branch: { id: "distCacheHit", label: "hit", to: (s) => s.finalAnswer },
  },
  {
    id: "bloom",
    label: "Bloom filter",
    sublabel: "in-memory pre-check",
    caption: (s) =>
      s.earlyExit === "bloomNo"
        ? `The filter says no. One of the three hashed bits is zero — nobody with this canonical email could have been inserted. The server responds without touching the database.`
        : `The filter says maybe. All three hashed bits are on. Could be a real account, could be a coincidence. The server asks the database.`,
    branch: { id: "bloomNo", label: "no", to: () => "available" },
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
 * FlowDemo — mobile-first single-column pipeline. Trunk nodes stack vertically;
 * when a scenario short-circuits, the "exit here" chip renders *inline below*
 * the branching stage. All nine trunk rows + a branch-slot are authored into
 * the SVG so the canvas height is stable across every scenario.
 */
export function FlowDemo({ initialScenario = "fresh", initialStep = 0 }: Props) {
  const [scenarioId, setScenarioId] = useState<Scenario["id"]>(initialScenario);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

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

  // Mobile-first geometry. 360 wide fits a 360 px phone container without scroll.
  const WIDTH = 360;
  const NODE_W = 320;
  const NODE_H = 46;
  const ROW_GAP = 14;
  const BRANCH_H = 34;
  const TRUNK_X = (WIDTH - NODE_W) / 2;
  const TOP_PAD = 12;

  // Reserve vertical space for ALL trunk stages + a branch slot after each
  // branch-capable stage. Canvas height never changes across scenarios.
  const BRANCH_ROWS = TRUNK_STAGES.filter((s) => s.branch).length;
  const HEIGHT =
    TOP_PAD +
    TRUNK_STAGES.length * (NODE_H + ROW_GAP) +
    BRANCH_ROWS * (BRANCH_H + ROW_GAP) +
    10;

  // Compute y-offsets for each trunk stage accounting for branch slots above it.
  const trunkYs = useMemo(() => {
    const ys: number[] = [];
    let cursor = TOP_PAD;
    for (let i = 0; i < TRUNK_STAGES.length; i++) {
      ys.push(cursor);
      cursor += NODE_H + ROW_GAP;
      if (TRUNK_STAGES[i].branch) {
        cursor += BRANCH_H + ROW_GAP;
      }
    }
    return ys;
  }, []);

  const visibleIds = new Set(visibleStages.map((s) => s.id));
  const isActive = (id: StageId) => current.id === id;
  const isPast = (id: StageId) => {
    const i = visibleStages.findIndex((s) => s.id === id);
    return i >= 0 && i < clamped;
  };
  const isVisible = (id: StageId) => visibleIds.has(id);

  const answerTone =
    scenario.finalAnswer === "available" ? "var(--color-accent)" : "var(--color-text)";

  const branchFired = (stg: Stage): boolean =>
    !!stg.branch &&
    scenario.earlyExit === stg.branch.id &&
    clamped >= TRUNK_STAGES.findIndex((s) => s.id === stg.id);

  return (
    <WidgetShell
      title="flow · end-to-end"
      measurements={`step ${clamped + 1}/${visibleStages.length}`}
      caption={current.caption(scenario)}
      controls={
        <div className="flex flex-col gap-[var(--spacing-sm)]">
          <Stepper value={clamped} total={visibleStages.length} onChange={setStep} />
          <div
            className="flex flex-wrap items-center gap-x-[var(--spacing-2xs)] gap-y-[var(--spacing-2xs)] font-sans"
            style={{ fontSize: "var(--text-ui)", minHeight: 44 }}
          >
            {SCENARIOS.map((s, i) => {
              const active = scenarioId === s.id;
              return (
                <span key={s.id} className="flex items-center">
                  {i > 0 ? (
                    <span
                      className="mx-[var(--spacing-2xs)]"
                      style={{ color: "var(--color-text-muted)" }}
                      aria-hidden
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
        style={{ maxWidth: WIDTH, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`Flow demo, scenario: ${scenario.label}, step ${clamped + 1}: ${current.label}`}
      >
        {TRUNK_STAGES.map((stg, i) => {
          const y = trunkYs[i];
          const active = isActive(stg.id);
          const past = isPast(stg.id);
          const vis = isVisible(stg.id);
          const opacity = vis ? (active ? 1 : past ? 0.9 : 0.6) : 0.22;
          const borderColor = active
            ? "var(--color-accent)"
            : past
              ? "var(--color-text-muted)"
              : "var(--color-rule)";

          const fired = branchFired(stg);
          const branchY = y + NODE_H + ROW_GAP;

          const nextVisibleIdx = TRUNK_STAGES.findIndex(
            (s, j) => j > i && isVisible(s.id),
          );
          const drawEdge = !fired && nextVisibleIdx !== -1;

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
                y={y + (stg.sublabel ? 18 : NODE_H / 2)}
                dominantBaseline="central"
                fontFamily="var(--font-sans)"
                fontSize={13}
                fill={active || past ? "var(--color-text)" : "var(--color-text-muted)"}
              >
                {stg.label}
              </text>
              {stg.sublabel ? (
                <text
                  x={TRUNK_X + 14}
                  y={y + 33}
                  fontFamily="var(--font-mono)"
                  fontSize={9}
                  fill="var(--color-text-muted)"
                >
                  {stg.sublabel}
                </text>
              ) : null}

              {/* Canonical chip under normalise, once reached */}
              {stg.id === "normalise" &&
              clamped >= visibleStages.findIndex((s) => s.id === "normalise") ? (
                <motion.text
                  key={`can-${scenario.id}`}
                  x={TRUNK_X + NODE_W - 14}
                  y={y + NODE_H - 6}
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                  fontSize={10}
                  fill="var(--color-accent)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={SPRING.smooth}
                >
                  → {scenario.canonical}
                </motion.text>
              ) : null}

              {/* Trunk-to-next edge — only if the next visible stage lives directly below */}
              {drawEdge ? (
                <line
                  x1={WIDTH / 2}
                  x2={WIDTH / 2}
                  y1={y + NODE_H}
                  y2={y + NODE_H + ROW_GAP}
                  stroke="var(--color-text-muted)"
                  strokeWidth={1.2}
                  opacity={0.5}
                />
              ) : null}

              {/* Inline branch chip — reserved slot beneath every branch-capable stage */}
              {stg.branch ? (
                <motion.g
                  initial={false}
                  animate={{ opacity: fired ? 1 : 0 }}
                  transition={SPRING.smooth}
                >
                  {/* Connector from the trunk into the branch chip */}
                  <motion.line
                    x1={WIDTH / 2}
                    x2={WIDTH / 2}
                    y1={y + NODE_H}
                    y2={branchY}
                    stroke="var(--color-accent)"
                    strokeWidth={1.6}
                    initial={false}
                    animate={{ pathLength: fired ? 1 : 0 }}
                    transition={SPRING.smooth}
                  />
                  <rect
                    x={TRUNK_X + 24}
                    y={branchY}
                    width={NODE_W - 48}
                    height={BRANCH_H}
                    rx={3}
                    fill="color-mix(in oklab, var(--color-accent) 16%, transparent)"
                    stroke="var(--color-accent)"
                    strokeWidth={1.4}
                  />
                  <text
                    x={TRUNK_X + 36}
                    y={branchY + BRANCH_H / 2}
                    dominantBaseline="central"
                    fontFamily="var(--font-mono)"
                    fontSize={11}
                    fill="var(--color-accent)"
                  >
                    {stg.branch.label}
                  </text>
                  <text
                    x={TRUNK_X + NODE_W - 36}
                    y={branchY + BRANCH_H / 2}
                    textAnchor="end"
                    dominantBaseline="central"
                    fontFamily="var(--font-mono)"
                    fontSize={12}
                    fill="var(--color-text)"
                  >
                    → {stg.branch.to(scenario)}
                  </text>
                </motion.g>
              ) : null}
            </motion.g>
          );
        })}

        {/* Final-answer emphasis when scenario reaches Spanner */}
        {!scenario.earlyExit && clamped === visibleStages.length - 1 ? (
          <motion.text
            x={WIDTH / 2}
            y={HEIGHT - 2}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill={answerTone}
            initial={{ opacity: 0, y: HEIGHT + 4 }}
            animate={{ opacity: 1, y: HEIGHT - 2 }}
            transition={{ ...SPRING.smooth, delay: 0.08 }}
          >
            answer: <tspan fontWeight={600}>{scenario.finalAnswer}</tspan>
          </motion.text>
        ) : null}
      </svg>
    </WidgetShell>
  );
}
