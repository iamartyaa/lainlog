"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Stepper } from "@/components/viz/Stepper";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { Arrow } from "@/components/viz/Arrow";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type Mode = "var" | "let";

const N = 5;
const TOTAL_STEPS = N + 1;

function captionFor(mode: Mode, step: number): string {
  if (step === 0) {
    return mode === "var"
      ? "Loop has finished. i is 5. Five callbacks scheduled — all five with a line back to the same cell."
      : "Loop has finished. Five callbacks scheduled — each with a line back to its own per-iteration cell. Each cell holds the value i had that round.";
  }
  const fired = step;
  const printed =
    mode === "var"
      ? Array(fired).fill(N).join(" ")
      : Array.from({ length: fired }, (_, i) => i).join(" ");
  return mode === "var"
    ? `Timer ${fired} fires. It follows its line to the shared cell — which holds 5. Prints: ${printed}.`
    : `Timer ${fired} fires. It follows its line to the iteration ${fired - 1} cell. Prints: ${printed}.`;
}

export function LoopTrap() {
  const [mode, setMode] = useState<Mode>("var");
  const [step, setStep] = useState(0);

  // Canvas geometry
  const WIDTH = 680;
  const HEIGHT = 300;

  const CB_Y = 36;
  const CB_W = 84;
  const CB_H = 40;
  const CB_GAP = 20;
  const CB_TOTAL_W = N * CB_W + (N - 1) * CB_GAP;
  const CB_X0 = (WIDTH - CB_TOTAL_W) / 2;

  const BIND_Y = 180;
  const BIND_H = 40;

  // In var mode: one wide cell spanning the callback row.
  const VAR_BIND_W = 140;
  const VAR_BIND_X = (WIDTH - VAR_BIND_W) / 2;

  // In let mode: five cells aligned under the callbacks.
  const LET_BIND_W = 60;

  // Current shared-var value (in var mode, after loop = N; while running = loop idx).
  const sharedVar = N;
  const letBindings = Array.from({ length: N }, (_, i) => i);

  // Fire state per callback: fired = step >= cbIndex + 1.
  const firedCount = step;
  const printedValues = Array.from({ length: firedCount }, (_, i) =>
    mode === "var" ? sharedVar : i,
  );

  return (
    <WidgetShell
      title="LoopTrap"
      measurements={`${mode} · ${N} callbacks · ${mode === "var" ? "1 cell" : `${N} cells`}`}
      caption={captionFor(mode, step)}
      controls={
        <div className="flex flex-wrap items-center gap-[var(--spacing-md)]">
          <ModeToggle
            mode={mode}
            onChange={(m) => {
              setMode(m);
              setStep(0);
            }}
          />
          <Stepper value={step} total={TOTAL_STEPS} onChange={setStep} playInterval={1100} />
        </div>
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
        role="img"
        aria-label={`LoopTrap: ${mode} mode, ${firedCount} of ${N} callbacks fired`}
      >
        <defs>
          <SvgDefs />
        </defs>

        {/* Callback boxes */}
        {Array.from({ length: N }, (_, i) => {
          const x = CB_X0 + i * (CB_W + CB_GAP);
          const fired = i < firedCount;
          const firing = i === firedCount - 1 && firedCount > 0;
          const fill = firing
            ? "color-mix(in oklab, var(--color-accent) 18%, transparent)"
            : fired
              ? "color-mix(in oklab, var(--color-surface) 60%, transparent)"
              : "transparent";
          const stroke = firing
            ? "var(--color-accent)"
            : "var(--color-rule)";
          return (
            <g key={`cb-${i}`}>
              <motion.rect
                x={x}
                y={CB_Y}
                width={CB_W}
                height={CB_H}
                rx={3}
                initial={false}
                animate={{ fill, stroke }}
                strokeWidth={firing ? 1.5 : 1}
                transition={SPRING.snappy}
              />
              <text
                x={x + CB_W / 2}
                y={CB_Y + 16}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill="var(--color-text-muted)"
              >
                cb{i}
              </text>
              <text
                x={x + CB_W / 2}
                y={CB_Y + 31}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={13}
                fill={fired ? "var(--color-text)" : "var(--color-text-muted)"}
              >
                {fired ? `log(${mode === "var" ? sharedVar : i})` : "log(i)"}
              </text>
            </g>
          );
        })}

        {/* Binding cell(s) — crossfade topology on mode change */}
        <AnimatePresence mode="wait">
          {mode === "var" ? (
            <motion.g
              key="var-bind"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING.smooth}
            >
              <rect
                x={VAR_BIND_X}
                y={BIND_Y}
                width={VAR_BIND_W}
                height={BIND_H}
                rx={3}
                fill="var(--color-accent)"
                fillOpacity={0.92}
              />
              <text
                x={VAR_BIND_X + VAR_BIND_W / 2}
                y={BIND_Y + 16}
                textAnchor="middle"
                fontFamily="var(--font-sans)"
                fontSize={10}
                fill="var(--color-bg)"
                opacity={0.85}
                letterSpacing="0.08em"
              >
                i (shared)
              </text>
              <text
                x={VAR_BIND_X + VAR_BIND_W / 2}
                y={BIND_Y + 32}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={15}
                fill="var(--color-bg)"
              >
                {sharedVar}
              </text>
            </motion.g>
          ) : (
            <motion.g
              key="let-bind"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING.smooth}
            >
              {letBindings.map((val, i) => {
                const x = CB_X0 + i * (CB_W + CB_GAP) + (CB_W - LET_BIND_W) / 2;
                return (
                  <g key={`bind-${i}`}>
                    <rect
                      x={x}
                      y={BIND_Y}
                      width={LET_BIND_W}
                      height={BIND_H}
                      rx={3}
                      fill="var(--color-accent)"
                      fillOpacity={0.92}
                    />
                    <text
                      x={x + LET_BIND_W / 2}
                      y={BIND_Y + 16}
                      textAnchor="middle"
                      fontFamily="var(--font-sans)"
                      fontSize={9}
                      fill="var(--color-bg)"
                      opacity={0.85}
                      letterSpacing="0.06em"
                    >
                      i #{i}
                    </text>
                    <text
                      x={x + LET_BIND_W / 2}
                      y={BIND_Y + 32}
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      fontSize={15}
                      fill="var(--color-bg)"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}
            </motion.g>
          )}
        </AnimatePresence>

        {/* Lines from each callback down to the cell it captured. */}
        {Array.from({ length: N }, (_, i) => {
          const cbCx = CB_X0 + i * (CB_W + CB_GAP) + CB_W / 2;
          const cbBy = CB_Y + CB_H;
          const bindX =
            mode === "var"
              ? VAR_BIND_X + VAR_BIND_W / 2
              : CB_X0 + i * (CB_W + CB_GAP) + CB_W / 2;
          const firing = i === firedCount - 1 && firedCount > 0;
          const tone = firing ? "active" : "muted";
          return (
            <Arrow
              key={`teth-${i}-${mode}`}
              x1={cbCx}
              y1={cbBy + 2}
              x2={bindX}
              y2={BIND_Y - 2}
              tone={tone}
              strokeWidth={firing ? 2 : 1.2}
            />
          );
        })}

        {/* Console area: what the callbacks have printed so far. */}
        <g>
          <text
            x={WIDTH / 2}
            y={HEIGHT - 32}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
            letterSpacing="0.08em"
          >
            CONSOLE
          </text>
          <text
            x={WIDTH / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={16}
            fill="var(--color-text)"
          >
            {printedValues.length > 0 ? printedValues.join(" ") : "\u00A0"}
          </text>
        </g>
      </svg>
    </WidgetShell>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Loop variable declaration"
      className="inline-flex items-center gap-[2px] rounded-[var(--radius-sm)] p-[2px]"
      style={{ background: "var(--color-surface)" }}
    >
      {(["var", "let"] as const).map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] font-mono transition-colors"
            style={{
              fontSize: "var(--text-small)",
              background: active ? "var(--color-bg)" : "transparent",
              color: active ? "var(--color-accent)" : "var(--color-text-muted)",
              fontWeight: active ? 600 : 400,
            }}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
