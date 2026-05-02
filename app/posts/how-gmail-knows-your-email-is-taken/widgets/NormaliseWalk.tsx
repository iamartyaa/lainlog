"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";

const TYPED = "J.Ohn.Doe+promo@gmail.com";

/** Each step yields the address as it stands AFTER applying the rule. */
const STAGES = [
  TYPED,
  "j.ohn.doe+promo@gmail.com", // step 1: lowercase
  "johndoe+promo@gmail.com", // step 2: strip dots
  "johndoe@gmail.com", // step 3: drop +tag
];

const STEPS = [
  { id: "lowercase", label: "lowercase", note: "fold to lower-case" },
  { id: "stripDots", label: "strip dots", note: "remove every dot in the local part" },
  { id: "dropTag", label: "drop +tag", note: "discard everything after the first +" },
];

const TOTAL = STAGES.length; // 4 — typed + 3 transforms

type Props = { initialStep?: number };

/**
 * NormaliseWalk — fixed input, three deterministic transforms, one verb (step).
 * Replaces NormalisePipeline (which had a 4-scenario picker + a stepper in the
 * same controls slot — two verbs). The Workspace branch lives in the prose
 * <Aside> below the widget, not as a fourth scenario chip.
 *
 * Frame-stable: 4 fixed steps, identical canvas height across all transitions.
 */
export function NormaliseWalk({ initialStep = 0 }: Props) {
  const [step, setStep] = useState(initialStep);
  const clamped = Math.max(0, Math.min(step, TOTAL - 1));
  const currentValue = STAGES[clamped];

  const stepCaption = useMemo(() => {
    if (clamped === 0) {
      return "Typed input. Nothing has been transformed yet. Step through to watch the three rules apply, in order.";
    }
    const s = STEPS[clamped - 1];
    return `Step ${clamped}/3 — ${s.label}. ${s.note}.`;
  }, [clamped]);

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
      title="normalise walk · three steps"
      state={stepCaption}
      controls={
        <WidgetNav value={clamped} total={TOTAL} onChange={setStep} />
      }
      canvas={
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
        aria-label={`Normalisation walk. Current value: ${currentValue}. Step ${clamped} of 3.`}
      >
        {/* Current-value box */}
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
            key={`v-${clamped}`}
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
            : clamped === 3
              ? "CANONICAL"
              : `AFTER STEP ${clamped}`}
        </text>

        {/* Pipeline pills — each transform highlights when active. */}
        {STEPS.map((s, i) => {
          const segmentW = (WIDTH - 36) / STEPS.length;
          const x = 18 + i * segmentW;
          const active = clamped === i + 1;
          const past = clamped > i + 1;
          const tone = active
            ? "var(--color-accent)"
            : past
              ? "var(--color-text)"
              : "var(--color-text-muted)";
          return (
            <motion.g
              key={s.id}
              initial={false}
              animate={{ opacity: active || past ? 1 : 0.5 }}
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

        {/* Canonical-form footer */}
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
            {STAGES[3]}
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
      }
    />
  );
}
