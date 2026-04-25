"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Stepper } from "@/components/viz/Stepper";
import { PRESS, SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type ScenarioId = "messy" | "tagged" | "googlemail" | "workspace";

type Scenario = {
  id: ScenarioId;
  label: string;
  typed: string;
  /** Per-stage value after applying step 0..3. Workspace short-circuits. */
  stages: string[];
  /** True if this address bypasses the consumer-Gmail pipeline. */
  workspace?: boolean;
};

const SCENARIOS: Scenario[] = [
  {
    id: "messy",
    label: "J.Ohn.Doe",
    typed: "J.Ohn.Doe@gmail.com",
    stages: [
      "J.Ohn.Doe@gmail.com",
      "j.ohn.doe@gmail.com",
      "johndoe@gmail.com",
      "johndoe@gmail.com",
    ],
  },
  {
    id: "tagged",
    label: "+promo",
    typed: "john.doe+promo@gmail.com",
    stages: [
      "john.doe+promo@gmail.com",
      "john.doe+promo@gmail.com",
      "johndoe+promo@gmail.com",
      "johndoe@gmail.com",
    ],
  },
  {
    id: "googlemail",
    label: "googlemail",
    typed: "j.ohndoe+work@googlemail.com",
    stages: [
      "j.ohndoe+work@googlemail.com",
      "j.ohndoe+work@googlemail.com",
      "johndoe+work@googlemail.com",
      "johndoe@gmail.com",
    ],
  },
  {
    id: "workspace",
    label: "@company.com",
    typed: "johndoe@company.com",
    stages: [
      "johndoe@company.com",
      "johndoe@company.com",
      "johndoe@company.com",
      "johndoe@company.com",
    ],
    workspace: true,
  },
];

const STEPS = [
  { id: "lowercase", label: "lowercase", note: "fold to lower-case" },
  { id: "stripDots", label: "strip dots", note: "remove every dot in the local part" },
  { id: "dropTag", label: "drop +tag", note: "discard everything after the first +" },
];

type Props = { initialScenario?: ScenarioId };

/**
 * NormalisePipeline — three deterministic transformations turn any Gmail
 * address into one canonical form. The reader picks one of four typed inputs;
 * the stepper advances through the three transforms; the address morphs
 * one transform at a time. Workspace addresses fork off — the chip lights
 * the "tenant rules" branch instead of running the three transforms.
 */
export function NormalisePipeline({ initialScenario = "messy" }: Props) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenario);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const [step, setStep] = useState(0);
  // Step 0 = typed (no transform yet); steps 1..3 = after lowercase / strip-dots / drop-tag.
  const totalSteps = scenario.workspace ? 1 : STEPS.length + 1;
  const clamped = Math.max(0, Math.min(step, totalSteps - 1));

  const currentValue = scenario.workspace
    ? scenario.typed
    : scenario.stages[clamped];

  const stepCaption = useMemo(() => {
    if (scenario.workspace) {
      return "Workspace address. Tenant admin decides whether dots and +tags collapse — Gmail's three-step rule does not apply.";
    }
    if (clamped === 0) {
      return `Typed input. Nothing has been transformed yet. Step through to see the three rules apply, in order.`;
    }
    const s = STEPS[clamped - 1];
    return `Step ${clamped}/3 — ${s.label}. ${s.note}.`;
  }, [scenario.workspace, clamped]);

  // Geometry — mobile-first 360.
  const WIDTH = 360;
  const VALUE_BOX_Y = 14;
  const VALUE_BOX_H = 44;
  const PIPE_Y = VALUE_BOX_Y + VALUE_BOX_H + 18;
  const PIPE_H = 26;
  const CANONICAL_Y = PIPE_Y + PIPE_H + 22;
  const CANONICAL_H = 38;
  const HEIGHT = CANONICAL_Y + CANONICAL_H + 14;

  return (
    <WidgetShell
      title="normalise · three deterministic steps"
      measurements={`step ${clamped}/${totalSteps - 1}`}
      caption={stepCaption}
      controls={
        <div className="flex flex-col gap-[var(--spacing-sm)]">
          <Stepper
            value={clamped}
            total={totalSteps}
            onChange={setStep}
            playable={!scenario.workspace}
          />
          <div
            className="flex flex-wrap items-center gap-x-[var(--spacing-2xs)] font-sans"
            style={{ fontSize: "var(--text-ui)", minHeight: 44 }}
          >
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
                    aria-label={`scenario: ${s.typed}`}
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
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`Normalisation pipeline. ${scenario.workspace ? "Workspace branch — no transforms apply." : `Current value: ${currentValue}.`}`}
      >
        {/* Current-value box (morphs as steps advance) */}
        <rect
          x={14}
          y={VALUE_BOX_Y}
          width={WIDTH - 28}
          height={VALUE_BOX_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 40%, transparent)"
          stroke={clamped === 0 ? "var(--color-rule)" : "var(--color-accent)"}
          strokeWidth={clamped === 0 ? 1 : 1.4}
        />
        <text
          x={WIDTH / 2}
          y={VALUE_BOX_Y + VALUE_BOX_H / 2 - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={13}
          fill="var(--color-text)"
        >
          <motion.tspan
            key={`v-${scenarioId}-${clamped}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.smooth}
          >
            {currentValue}
          </motion.tspan>
        </text>
        <text
          x={WIDTH / 2}
          y={VALUE_BOX_Y + VALUE_BOX_H - 8}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          {clamped === 0
            ? "TYPED"
            : scenario.workspace
              ? "TENANT-MANAGED"
              : clamped === 3
                ? "CANONICAL"
                : `AFTER STEP ${clamped}`}
        </text>

        {/* Pipeline pills — each transform highlights when it's the active step */}
        {STEPS.map((s, i) => {
          const segmentW = (WIDTH - 36) / STEPS.length;
          const x = 18 + i * segmentW;
          const active = !scenario.workspace && clamped === i + 1;
          const past = !scenario.workspace && clamped > i + 1;
          const dimmed = scenario.workspace;
          const tone = dimmed
            ? "var(--color-text-muted)"
            : active
              ? "var(--color-accent)"
              : past
                ? "var(--color-text)"
                : "var(--color-text-muted)";
          return (
            <motion.g
              key={s.id}
              initial={false}
              animate={{
                opacity: dimmed ? 0.32 : active || past ? 1 : 0.5,
              }}
              transition={SPRING.smooth}
            >
              <rect
                x={x + 4}
                y={PIPE_Y}
                width={segmentW - 8}
                height={PIPE_H}
                rx={3}
                fill={
                  active
                    ? "color-mix(in oklab, var(--color-accent) 16%, transparent)"
                    : past
                      ? "color-mix(in oklab, var(--color-surface) 60%, transparent)"
                      : "transparent"
                }
                stroke={tone}
                strokeWidth={active ? 1.6 : 1}
                strokeDasharray={dimmed ? "3 3" : undefined}
              />
              <text
                x={x + segmentW / 2}
                y={PIPE_Y + PIPE_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill={tone}
              >
                {s.label}
              </text>
            </motion.g>
          );
        })}

        {/* Workspace branch chip — only visible on the workspace scenario */}
        {scenario.workspace ? (
          <motion.g
            initial={false}
            animate={{ opacity: 1 }}
            transition={SPRING.smooth}
          >
            <rect
              x={WIDTH / 2 - 90}
              y={CANONICAL_Y}
              width={180}
              height={CANONICAL_H}
              rx={3}
              fill="color-mix(in oklab, var(--color-accent) 14%, transparent)"
              stroke="var(--color-accent)"
              strokeWidth={1.4}
            />
            <text
              x={WIDTH / 2}
              y={CANONICAL_Y + CANONICAL_H / 2 - 4}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-accent)"
            >
              tenant rules
            </text>
            <text
              x={WIDTH / 2}
              y={CANONICAL_Y + CANONICAL_H - 8}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={9}
              fill="var(--color-text-muted)"
              letterSpacing="0.08em"
            >
              ADMIN-CONFIGURED
            </text>
          </motion.g>
        ) : (
          <motion.g
            initial={false}
            animate={{ opacity: clamped === 3 ? 1 : 0.55 }}
            transition={SPRING.smooth}
          >
            <rect
              x={WIDTH / 2 - 110}
              y={CANONICAL_Y}
              width={220}
              height={CANONICAL_H}
              rx={3}
              fill={
                clamped === 3
                  ? "color-mix(in oklab, var(--color-accent) 18%, transparent)"
                  : "transparent"
              }
              stroke={clamped === 3 ? "var(--color-accent)" : "var(--color-rule)"}
              strokeWidth={clamped === 3 ? 1.4 : 1}
            />
            <text
              x={WIDTH / 2}
              y={CANONICAL_Y + CANONICAL_H / 2 - 4}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-mono)"
              fontSize={13}
              fill="var(--color-text)"
            >
              {scenario.stages[3]}
            </text>
            <text
              x={WIDTH / 2}
              y={CANONICAL_Y + CANONICAL_H - 8}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={9}
              fill="var(--color-text-muted)"
              letterSpacing="0.08em"
            >
              CANONICAL FORM
            </text>
          </motion.g>
        )}

        {/* Connectors */}
        <line
          x1={WIDTH / 2}
          y1={VALUE_BOX_Y + VALUE_BOX_H}
          x2={WIDTH / 2}
          y2={PIPE_Y}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          opacity={0.5}
        />
        <line
          x1={WIDTH / 2}
          y1={PIPE_Y + PIPE_H}
          x2={WIDTH / 2}
          y2={CANONICAL_Y}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          opacity={0.5}
        />
      </svg>
    </WidgetShell>
  );
}
