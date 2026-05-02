"use client";

import { memo, useState } from "react";
import { motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { Arrow } from "@/components/viz/Arrow";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";

const TICK_STEPS = 6;

type Tick = {
  /** The render that is currently on screen at the start of this tick. */
  displayedRender: number;
  /** Bindings created so far. Index = render number; value = count binding. */
  bindings: number[];
  /** Which render's binding the effect's callback is tethered to. */
  tetherRender: number;
};

/**
 * Build the broken-mode timeline once, at module scope. Every tick the
 * callback re-reads render 0's stale 0 and tries to setCount(0+1); React
 * spawns render 1 with count=1 the first time, then bails out on subsequent
 * identical sets. The tether never moves.
 */
function buildBrokenTimeline(): Tick[] {
  const ticks: Tick[] = [];
  let bindings = [0];
  ticks.push({ displayedRender: 0, bindings: [...bindings], tetherRender: 0 });
  bindings = [...bindings, 1];
  ticks.push({ displayedRender: 1, bindings: [...bindings], tetherRender: 0 });
  for (let i = 0; i < 4; i++) {
    ticks.push({ displayedRender: 1, bindings: [...bindings], tetherRender: 0 });
  }
  return ticks;
}

const TICKS: Tick[] = buildBrokenTimeline();

function captionFor(step: number): string {
  if (step === 0) {
    return "First render. count = 0. The effect creates an interval; the callback captures count from this render. See the tether.";
  }
  if (step === 1) {
    return "Tick 1: callback reads render 0's count (0), calls setCount(0 + 1). Render 1 spawns with count = 1 — but the interval still ticks the old callback.";
  }
  return `Tick ${step}: still reading render 0's stale 0. Screen stuck at 1.`;
}

export function RenderBroken() {
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
      title="render · broken"
      measurements="count + 1"
      state={captionFor(step)}
      controls={
        <WidgetNav
          value={step}
          total={TICK_STEPS}
          onChange={setStep}
          playInterval={1200}
          counterNoun="tick"
          ariaLabel="Step broken-render timeline"
        />
      }
      canvas={
        <>
          <div className="bs-renderbroken-wide">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
          role="img"
          aria-label={`RenderBroken: tick ${step} of ${TICK_STEPS - 1}`}
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
            const isTethered = renderIdx === tick.tetherRender;
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
              () =&gt; setCount(
            </text>
            <text
              x={EFFECT_X + 10}
              y={EFFECT_Y + 60}
              fontFamily="var(--font-mono)"
              fontSize={12}
              fill="var(--color-accent)"
            >
              {"  count + 1"}
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

          {/* Tether from callback to render 0 — mount-in fade preserved */}
          <motion.g
            key="tether"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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

          {/* Screen — what the user sees, i.e. the displayed render's count */}
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
          <div className="bs-renderbroken-narrow">
            <MemoNarrowRenderBroken step={step} tick={tick} />
          </div>
        </>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                     Narrow portrait layout (mobile-first)                  */
/* -------------------------------------------------------------------------- */

function NarrowRenderBroken({
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
      aria-label={`RenderBroken: tick ${step} of ${TICK_STEPS - 1}`}
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

      {/* Render stack — only the most recent MAX_RENDERS */}
      {visibleRenders.map((countVal, localIdx) => {
        const renderIdx = renderIdxOffset + localIdx;
        const y = R_Y0 + localIdx * (R_H + R_GAP);
        const isDisplayed = renderIdx === tick.displayedRender;
        const isTethered = renderIdx === tick.tetherRender;
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
              strokeWidth={isTethered || isDisplayed ? 1.3 : 1}
              strokeDasharray={isTethered ? "0" : isDisplayed ? "0" : "3 3"}
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
            {isTethered || isDisplayed ? (
              <text
                x={R_X + R_W - 10}
                y={y + 15}
                textAnchor="end"
                fontFamily="var(--font-sans)"
                fontSize={8}
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
          fill="var(--color-accent)"
        >
          {"  count + 1"}
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

      {/* Tether — vertical arrow from callback UP to tethered render */}
      <motion.g
        key="n-tether"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        {(() => {
          const tetherLocalIdx = tick.tetherRender - renderIdxOffset;
          const targetLocalIdx =
            tetherLocalIdx >= 0 && tetherLocalIdx < MAX_RENDERS
              ? tetherLocalIdx
              : 0;
          const y2 = R_Y0 + targetLocalIdx * (R_H + R_GAP) + R_H;
          return (
            <Arrow
              x1={EFFECT_X + 60}
              y1={EFFECT_Y}
              x2={EFFECT_X + 60}
              y2={y2}
              tone="active"
              strokeWidth={2}
              curvature={12}
            />
          );
        })()}
      </motion.g>
    </svg>
  );
}

const MemoNarrowRenderBroken = memo(NarrowRenderBroken);
