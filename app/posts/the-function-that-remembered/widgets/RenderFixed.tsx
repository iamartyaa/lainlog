"use client";

import { memo, useState } from "react";
import { motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";

const TICK_STEPS = 6;

type Tick = {
  /** The render that is currently on screen at the start of this tick. */
  displayedRender: number;
  /** Bindings created so far. Index = render number; value = count binding. */
  bindings: number[];
};

/**
 * Build the fixed-mode timeline once, at module scope. Every tick the updater
 * runs, React supplies the current count, and a new render is produced. No
 * tether — the callback never reads a captured `count`.
 */
function buildFixedTimeline(): Tick[] {
  const ticks: Tick[] = [];
  let bindings = [0];
  ticks.push({ displayedRender: 0, bindings: [...bindings] });
  for (let t = 1; t < TICK_STEPS; t++) {
    bindings = [...bindings, t];
    ticks.push({ displayedRender: t, bindings: [...bindings] });
  }
  return ticks;
}

const TICKS: Tick[] = buildFixedTimeline();

function captionFor(step: number): string {
  if (step === 0) {
    return "Same component, but setCount(c => c + 1). The callback doesn't capture count at all — it asks React for the current one. No tether.";
  }
  return `Tick ${step}. React calls the updater, hands it count = ${step - 1}, produces render ${step} with count = ${step}. No staleness to accumulate.`;
}

export function RenderFixed() {
  const [step, setStep] = useState(0);
  const tick = TICKS[Math.min(step, TICKS.length - 1)];

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
      title="render · fixed"
      measurements="c => c + 1"
      state={captionFor(step)}
      controls={
        <WidgetNav
          value={step}
          total={TICK_STEPS}
          onChange={setStep}
          playInterval={1200}
          counterNoun="tick"
          ariaLabel="Step fixed-render timeline"
        />
      }
      canvas={
        <>
          <div className="bs-renderfixed-wide">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
          role="img"
          aria-label={`RenderFixed: tick ${step} of ${TICK_STEPS - 1}`}
        >
          <defs>
            <SvgDefs />
          </defs>

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
            const borderColor = isDisplayed
              ? "var(--color-text-muted)"
              : "var(--color-rule)";
            const bgFill = isDisplayed
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
                  strokeWidth={isDisplayed ? 1.3 : 1}
                  strokeDasharray={isDisplayed ? "0" : "3 3"}
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
                {isDisplayed ? (
                  <text
                    x={RENDER_X + RENDER_W - 10}
                    y={y + 16}
                    textAnchor="end"
                    fontFamily="var(--font-sans)"
                    fontSize={9}
                    fill="var(--color-text-muted)"
                    letterSpacing="0.08em"
                  >
                    ON SCREEN
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
              () =&gt; setCount(
            </text>
            <text
              x={EFFECT_X + 10}
              y={EFFECT_Y + 60}
              fontFamily="var(--font-mono)"
              fontSize={12}
              fill="var(--color-text)"
            >
              {"  c => c + 1"}
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

          {/* No tether — label only, mount-in fade preserved */}
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
            transition={SPRING.smooth}
          >
            (no tether)
          </motion.text>

          {/* Screen */}
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
            <motion.text
              key={`screen-${tick.displayedRender}`}
              x={SCREEN_X + SCREEN_W / 2}
              y={SCREEN_Y + 64}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={44}
              fontWeight={500}
              fill="var(--color-text)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={SPRING.snappy}
            >
              {tick.bindings[tick.displayedRender]}
            </motion.text>
          </g>
        </svg>
      </div>
          <div className="bs-renderfixed-narrow">
            <MemoNarrowRenderFixed step={step} tick={tick} />
          </div>
        </>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                     Narrow portrait layout (mobile-first)                  */
/* -------------------------------------------------------------------------- */

function NarrowRenderFixed({
  step,
  tick,
}: {
  step: number;
  tick: Tick;
}) {
  const W = 360;
  const SCREEN_X = 18;
  const SCREEN_Y = 20;
  const SCREEN_W = W - SCREEN_X * 2;
  const SCREEN_H = 68;

  const MAX_RENDERS = 3;
  const visibleRenders = tick.bindings.slice(-MAX_RENDERS);
  const renderIdxOffset = tick.bindings.length - visibleRenders.length;

  const R_X = 18;
  const R_Y0 = SCREEN_Y + SCREEN_H + 24;
  const R_W = W - R_X * 2;
  const R_H = 40;
  const R_GAP = 6;

  const EFFECT_X = 18;
  const EFFECT_Y = R_Y0 + MAX_RENDERS * (R_H + R_GAP) + 40;
  const EFFECT_W = W - EFFECT_X * 2;
  const EFFECT_H = 88;
  const H = EFFECT_Y + EFFECT_H + 20;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: W, height: "auto", display: "block" }}
      role="img"
      aria-label={`RenderFixed: tick ${step} of ${TICK_STEPS - 1}`}
    >
      {/* Screen */}
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
          y={SCREEN_Y + 16}
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          SCREEN
        </text>
        <motion.text
          key={`n-screen-${tick.displayedRender}`}
          x={SCREEN_X + SCREEN_W / 2}
          y={SCREEN_Y + 54}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={36}
          fontWeight={500}
          fill="var(--color-text)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={SPRING.snappy}
        >
          {tick.bindings[tick.displayedRender]}
        </motion.text>
      </g>

      {/* Renders header */}
      <text
        x={R_X}
        y={R_Y0 - 8}
        fontFamily="var(--font-sans)"
        fontSize={9}
        fill="var(--color-text-muted)"
        letterSpacing="0.08em"
      >
        RENDERS
      </text>

      {/* Render stack — most recent MAX_RENDERS */}
      {visibleRenders.map((countVal, localIdx) => {
        const renderIdx = renderIdxOffset + localIdx;
        const y = R_Y0 + localIdx * (R_H + R_GAP);
        const isDisplayed = renderIdx === tick.displayedRender;
        const borderColor = isDisplayed
          ? "var(--color-text-muted)"
          : "var(--color-rule)";
        const bgFill = isDisplayed
          ? "color-mix(in oklab, var(--color-surface) 70%, transparent)"
          : "transparent";
        return (
          <motion.g
            key={`n-render-${renderIdx}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={SPRING.smooth}
          >
            <rect
              x={R_X}
              y={y}
              width={R_W}
              height={R_H}
              rx={3}
              fill={bgFill}
              stroke={borderColor}
              strokeWidth={isDisplayed ? 1.3 : 1}
              strokeDasharray={isDisplayed ? "0" : "3 3"}
            />
            <text
              x={R_X + 10}
              y={y + 15}
              fontFamily="var(--font-sans)"
              fontSize={10}
              fill="var(--color-text-muted)"
              letterSpacing="0.04em"
            >
              render {renderIdx}
            </text>
            <text
              x={R_X + 10}
              y={y + 30}
              fontFamily="var(--font-mono)"
              fontSize={12}
              fill="var(--color-text)"
            >
              count
            </text>
            <rect
              x={R_X + 64}
              y={y + 18}
              width={24}
              height={16}
              rx={2}
              fill="var(--color-accent)"
            />
            <text
              x={R_X + 76}
              y={y + 30}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-bg)"
            >
              {countVal}
            </text>
            {isDisplayed ? (
              <text
                x={R_X + R_W - 10}
                y={y + 15}
                textAnchor="end"
                fontFamily="var(--font-sans)"
                fontSize={8}
                fill="var(--color-text-muted)"
                letterSpacing="0.08em"
              >
                ON SCREEN
              </text>
            ) : null}
          </motion.g>
        );
      })}

      {/* Effect callback */}
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
          fontSize={11}
          fill="var(--color-text)"
        >
          () =&gt; setCount(
        </text>
        <text
          x={EFFECT_X + 10}
          y={EFFECT_Y + 58}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill="var(--color-text)"
        >
          {"  c => c + 1"}
        </text>
        <text
          x={EFFECT_X + 10}
          y={EFFECT_Y + 76}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill="var(--color-text)"
        >
          {")"}
        </text>
      </g>

      {/* No tether label */}
      <motion.text
        key="n-no-tether"
        x={EFFECT_X + EFFECT_W - 10}
        y={EFFECT_Y - 6}
        textAnchor="end"
        fontFamily="var(--font-sans)"
        fontSize={10}
        fill="var(--color-text-muted)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        (no tether)
      </motion.text>
    </svg>
  );
}

const MemoNarrowRenderFixed = memo(NarrowRenderFixed);
