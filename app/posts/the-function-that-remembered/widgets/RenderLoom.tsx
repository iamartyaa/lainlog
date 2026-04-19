"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Stepper } from "@/components/viz/Stepper";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { Arrow } from "@/components/viz/Arrow";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type Mode = "broken" | "fixed";

const TICK_STEPS = 6;

type Tick = {
  /** The render that is currently on screen at the start of this tick. */
  displayedRender: number;
  /** Bindings created so far. Index = render number; value = count binding. */
  bindings: number[];
  /** Which render's binding the effect's callback is tethered to (broken mode). */
  tetherRender: number | null;
  /** Last printed value, if any (the callback's log output). */
  printed: number | null;
};

function buildTimeline(mode: Mode): Tick[] {
  const ticks: Tick[] = [];
  if (mode === "broken") {
    // Broken: tether stays rooted in render 0 forever. Every tick: read 0, setCount(1).
    // After the first tick, React produces render 1 with count=1. From then on, no more renders
    // because setCount(1) is the same as the previous value (but we'll still show renders 1..5
    // symbolically to emphasise the staleness — each new render has its own count, but the
    // callback still reads render 0's).
    // For teaching clarity, we model: tick 0 = initial; tick i (i>=1) = callback fires reading
    // from render 0 (always 0), then setCount(0+1) = 1. First time it causes a new render
    // (render 1, count=1). After that, React may bail out. To keep the visual dramatic, show
    // up to 3 renders stacking, all with count at their captured values.
    let bindings = [0];
    ticks.push({ displayedRender: 0, bindings: [...bindings], tetherRender: 0, printed: null });
    // tick 1: callback fires, reads render 0's count (0), calls setCount(1). New render: count=1.
    bindings = [...bindings, 1];
    ticks.push({ displayedRender: 1, bindings: [...bindings], tetherRender: 0, printed: 0 });
    // tick 2: callback fires again, still reading render 0's count (0). setCount(1) — React may
    // skip, but we show it as "still 1, tether still broken".
    ticks.push({ displayedRender: 1, bindings: [...bindings], tetherRender: 0, printed: 0 });
    // tick 3-5: same story.
    ticks.push({ displayedRender: 1, bindings: [...bindings], tetherRender: 0, printed: 0 });
    ticks.push({ displayedRender: 1, bindings: [...bindings], tetherRender: 0, printed: 0 });
    ticks.push({ displayedRender: 1, bindings: [...bindings], tetherRender: 0, printed: 0 });
  } else {
    // Fixed: callback uses setCount(c => c+1). No tether to any render's count binding.
    // Every tick: React calls the updater with the current count and produces a new render.
    let bindings = [0];
    ticks.push({ displayedRender: 0, bindings: [...bindings], tetherRender: null, printed: null });
    for (let t = 1; t < TICK_STEPS; t++) {
      bindings = [...bindings, t];
      ticks.push({ displayedRender: t, bindings: [...bindings], tetherRender: null, printed: null });
    }
  }
  return ticks;
}

export function RenderLoom() {
  const [mode, setMode] = useState<Mode>("broken");
  const [step, setStep] = useState(0);

  const ticks = buildTimeline(mode);
  const tick = ticks[Math.min(step, ticks.length - 1)];

  // Canvas geometry
  const WIDTH = 680;
  const HEIGHT = 360;

  const RENDER_X = 40;
  const RENDER_Y0 = 40;
  const RENDER_W = 220;
  const RENDER_H = 42;
  const RENDER_GAP = 6;
  const MAX_RENDERS_VISIBLE = 6;

  const EFFECT_X = 420;
  const EFFECT_Y = 140;
  const EFFECT_W = 220;
  const EFFECT_H = 96;

  const SCREEN_X = 420;
  const SCREEN_Y = 240;
  const SCREEN_W = 220;
  const SCREEN_H = 80;

  return (
    <WidgetShell
      title="RenderLoom"
      measurements={`${mode === "broken" ? "count + 1" : "c => c + 1"} · tick ${step}/${TICK_STEPS - 1}`}
      caption={
        mode === "broken"
          ? step === 0
            ? "First render. count = 0. The effect runs and creates an interval. The callback captures count from THIS render — see the tether."
            : step === 1
              ? "Tick 1. Callback reads from render 0 (count = 0). Calls setCount(0 + 1). Render 1 spawns with count = 1 — but the interval still ticks the old callback, still tethered to render 0."
              : "More ticks. New renders pile up above with their own bindings, but the interval's tether hasn't moved. It keeps reading render 0's stale 0. The counter on screen stays stuck at 1."
          : step === 0
            ? "Same component, but setCount(c => c + 1). The callback doesn't capture count at all — it asks React for the current one. No tether."
            : `Tick ${step}. React produces render ${step} with count = ${step}. The interval fires, the updater runs, React hands it the current count, and a new render with count + 1 is produced. No staleness to accumulate.`
      }
      controls={
        <div className="flex flex-wrap items-center gap-[var(--spacing-md)]">
          <ModeToggle
            mode={mode}
            onChange={(m) => {
              setMode(m);
              setStep(0);
            }}
          />
          <Stepper value={step} total={TICK_STEPS} onChange={setStep} playInterval={1200} />
        </div>
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
        role="img"
        aria-label={`RenderLoom: ${mode} mode, tick ${step} of ${TICK_STEPS - 1}`}
      >
        <defs>
          <SvgDefs />
        </defs>

        {/* Section labels */}
        <text
          x={RENDER_X}
          y={22}
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          RENDERS
        </text>

        <text
          x={EFFECT_X}
          y={22}
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          CALLBACK
        </text>

        {/* Render stack */}
        {tick.bindings.map((countVal, renderIdx) => {
          if (renderIdx >= MAX_RENDERS_VISIBLE) return null;
          const y = RENDER_Y0 + renderIdx * (RENDER_H + RENDER_GAP);
          const isDisplayed = renderIdx === tick.displayedRender;
          const isTethered =
            mode === "broken" && renderIdx === tick.tetherRender;
          const borderColor = isTethered
            ? "var(--color-accent)"
            : isDisplayed
              ? "var(--color-text-muted)"
              : "var(--color-rule)";
          const bgFill = isTethered
            ? "color-mix(in oklab, var(--color-accent) 10%, transparent)"
            : isDisplayed
              ? "color-mix(in oklab, var(--color-surface) 70%, transparent)"
              : "transparent";
          return (
            <motion.g
              key={`render-${renderIdx}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING.smooth, delay: renderIdx === tick.bindings.length - 1 ? 0.06 : 0 }}
            >
              <rect
                x={RENDER_X}
                y={y}
                width={RENDER_W}
                height={RENDER_H}
                rx={3}
                fill={bgFill}
                stroke={borderColor}
                strokeWidth={isTethered || isDisplayed ? 1.3 : 1}
                strokeDasharray={isTethered ? "0" : isDisplayed ? "0" : "3 3"}
              />
              <text
                x={RENDER_X + 10}
                y={y + 16}
                fontFamily="var(--font-sans)"
                fontSize={10}
                fill="var(--color-text-muted)"
                letterSpacing="0.05em"
              >
                render {renderIdx}
              </text>
              <text
                x={RENDER_X + 10}
                y={y + 32}
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill="var(--color-text)"
              >
                count
              </text>
              <rect
                x={RENDER_X + 58}
                y={y + 20}
                width={24}
                height={18}
                rx={2}
                fill="var(--color-accent)"
              />
              <text
                x={RENDER_X + 70}
                y={y + 33}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill="var(--color-bg)"
              >
                {countVal}
              </text>
              {isTethered || isDisplayed ? (
                <text
                  x={RENDER_X + RENDER_W - 10}
                  y={y + 16}
                  textAnchor="end"
                  fontFamily="var(--font-sans)"
                  fontSize={9}
                  fill={isTethered ? "var(--color-accent)" : "var(--color-text-muted)"}
                  letterSpacing="0.08em"
                >
                  {isTethered && isDisplayed
                    ? "TETHERED · ON SCREEN"
                    : isTethered
                      ? "TETHERED"
                      : "ON SCREEN"}
                </text>
              ) : null}
            </motion.g>
          );
        })}

        {/* Effect's callback box */}
        <g>
          <rect
            x={EFFECT_X}
            y={EFFECT_Y}
            width={EFFECT_W}
            height={EFFECT_H}
            rx={3}
            fill="color-mix(in oklab, var(--color-surface) 80%, transparent)"
            stroke="var(--color-text-muted)"
            strokeWidth={1}
          />
          <text
            x={EFFECT_X + 10}
            y={EFFECT_Y + 18}
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
            letterSpacing="0.08em"
          >
            setInterval callback
          </text>
          <text
            x={EFFECT_X + 10}
            y={EFFECT_Y + 40}
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill="var(--color-text)"
          >
            {mode === "broken" ? "() => setCount(" : "() => setCount("}
          </text>
          <text
            x={EFFECT_X + 10}
            y={EFFECT_Y + 60}
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill={mode === "broken" ? "var(--color-accent)" : "var(--color-text)"}
          >
            {mode === "broken" ? "  count + 1" : "  c => c + 1"}
          </text>
          <text
            x={EFFECT_X + 10}
            y={EFFECT_Y + 80}
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill="var(--color-text)"
          >
            {")"}
          </text>
        </g>

        {/* Tether from callback to render 0 — exits with fade when mode flips to fixed */}
        <AnimatePresence>
          {mode === "broken" && tick.tetherRender !== null ? (
            <motion.g
              key="tether"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING.smooth}
            >
              <Arrow
                x1={EFFECT_X}
                y1={EFFECT_Y + 50}
                x2={RENDER_X + RENDER_W + 6}
                y2={RENDER_Y0 + tick.tetherRender * (RENDER_H + RENDER_GAP) + RENDER_H / 2}
                tone="active"
                curvature={-20}
                strokeWidth={2}
              />
            </motion.g>
          ) : (
            <motion.text
              key="no-tether-label"
              x={EFFECT_X - 10}
              y={EFFECT_Y + 54}
              textAnchor="end"
              fontFamily="var(--font-sans)"
              fontSize={10}
              fill="var(--color-text-muted)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING.smooth}
            >
              (no tether)
            </motion.text>
          )}
        </AnimatePresence>

        {/* "Screen": what the user sees, i.e. the displayed render's count */}
        <g>
          <rect
            x={SCREEN_X}
            y={SCREEN_Y}
            width={SCREEN_W}
            height={SCREEN_H}
            rx={3}
            fill="color-mix(in oklab, var(--color-accent) 6%, transparent)"
            stroke="var(--color-rule)"
            strokeWidth={1}
          />
          <text
            x={SCREEN_X + 10}
            y={SCREEN_Y + 18}
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
            letterSpacing="0.08em"
          >
            SCREEN
          </text>
          <AnimatePresence mode="popLayout">
            <motion.text
              key={`screen-${tick.displayedRender}-${mode}`}
              x={SCREEN_X + SCREEN_W / 2}
              y={SCREEN_Y + 60}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={44}
              fontWeight={500}
              fill="var(--color-text)"
              initial={{ opacity: 0, y: SCREEN_Y + 50 }}
              animate={{ opacity: 1, y: SCREEN_Y + 64 }}
              exit={{ opacity: 0 }}
              transition={SPRING.snappy}
            >
              {tick.bindings[tick.displayedRender]}
            </motion.text>
          </AnimatePresence>
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
      aria-label="Callback form"
      className="inline-flex items-center gap-[2px] rounded-[var(--radius-sm)] p-[2px]"
      style={{ background: "var(--color-surface)" }}
    >
      {(
        [
          { key: "broken" as const, label: "count + 1" },
          { key: "fixed" as const, label: "c => c + 1" },
        ]
      ).map((m) => {
        const active = m.key === mode;
        return (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.key)}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] font-mono transition-colors"
            style={{
              fontSize: "var(--text-small)",
              background: active ? "var(--color-bg)" : "transparent",
              color: active ? "var(--color-accent)" : "var(--color-text-muted)",
              fontWeight: active ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
