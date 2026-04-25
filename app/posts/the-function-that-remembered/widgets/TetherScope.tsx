"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { Arrow } from "@/components/viz/Arrow";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type Step = {
  activeLines: number[];
  caption: string;
  frameState: "hidden" | "live" | "pinned";
  showInnerFn: boolean;
  showTether: boolean;
  showLookup: boolean;
  returnValue: number | null;
};

const CODE_LINES = [
  "function makeRemember(x) {",
  "  return () => x;",
  "}",
  "",
  "const remember7 = makeRemember(7);",
  "",
  "// time passes. makeRemember returns.",
  "",
  "remember7();  //  ?",
];

const STEPS: Step[] = [
  {
    activeLines: [4],
    caption:
      "Call makeRemember(7). A new frame is created to run the call — it holds the parameter x bound to 7.",
    frameState: "live",
    showInnerFn: false,
    showTether: false,
    showLookup: false,
    returnValue: null,
  },
  {
    activeLines: [1],
    caption:
      "Inside the call, an inner arrow function () => x is built. Every function in JavaScript has an internal pointer — [[Environment]] — to the scope it was born in. That pointer gets wired to the current frame.",
    frameState: "live",
    showInnerFn: true,
    showTether: true,
    showLookup: false,
    returnValue: null,
  },
  {
    activeLines: [4],
    caption:
      "makeRemember returns the inner function. The call finishes. Normally the frame would be collected — but the returned function still points at it. A pointer the GC honors: the frame stays pinned.",
    frameState: "pinned",
    showInnerFn: true,
    showTether: true,
    showLookup: false,
    returnValue: null,
  },
  {
    activeLines: [8],
    caption:
      "Later, we call remember7(). The call needs x. It walks the tether back into the pinned frame, finds x = 7, and returns it.",
    frameState: "pinned",
    showInnerFn: true,
    showTether: true,
    showLookup: true,
    returnValue: 7,
  },
];

export function TetherScope() {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  // Canvas layout: 680 wide, ~360 tall.
  const WIDTH = 680;
  const HEIGHT = 360;
  const CODE_X = 24;
  const CODE_Y = 24;
  const CODE_LH = 22;

  const HEAP_X = 340;
  const FRAME_X = HEAP_X + 20;
  const FRAME_Y = 44;
  const FRAME_W = 180;
  const FRAME_H = 68;

  const FN_X = HEAP_X + 40;
  const FN_Y = 200;
  const FN_W = 200;
  const FN_H = 88;

  const returnedText = s.returnValue !== null ? String(s.returnValue) : "";

  return (
    <WidgetShell
      title="TetherScope"
      caption={s.caption}
      captionTone="prominent"
      controls={<WidgetNav value={step} total={STEPS.length} onChange={setStep} playInterval={1500} />}
    >
      <div className="bs-tetherscope-wide">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
        role="img"
        aria-label={`TetherScope: step ${step + 1} of ${STEPS.length}. ${s.caption}`}
      >
        <defs>
          <SvgDefs />
        </defs>

        {/* Vertical rule between code pane and heap pane */}
        <line
          x1={HEAP_X - 10}
          y1={16}
          x2={HEAP_X - 10}
          y2={HEIGHT - 16}
          stroke="var(--color-rule)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />

        {/* Section labels */}
        <text
          x={CODE_X}
          y={14}
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          CODE
        </text>
        <text
          x={HEAP_X}
          y={14}
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          RUNTIME
        </text>

        {/* Code lines with per-line active highlighting */}
        {CODE_LINES.map((line, i) => {
          const y = CODE_Y + i * CODE_LH;
          const active = s.activeLines.includes(i);
          return (
            <g key={`line-${i}`}>
              {active ? (
                <motion.rect
                  x={CODE_X - 6}
                  y={y - 2}
                  width={300}
                  height={CODE_LH - 2}
                  rx={2}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={SPRING.snappy}
                  fill="color-mix(in oklab, var(--color-accent) 14%, transparent)"
                />
              ) : null}
              <text
                x={CODE_X}
                y={y + CODE_LH - 8}
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill={active ? "var(--color-text)" : "var(--color-text-muted)"}
              >
                {line || "\u00A0"}
              </text>
            </g>
          );
        })}

        {/* Call-site result tag */}
        <AnimatePresence>
          {s.returnValue !== null ? (
            <motion.g
              key="return-tag"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING.smooth}
            >
              <rect
                x={CODE_X + 128}
                y={CODE_Y + 8 * CODE_LH - 4}
                width={46}
                height={CODE_LH - 2}
                rx={2}
                fill="var(--color-accent)"
              />
              <text
                x={CODE_X + 151}
                y={CODE_Y + 8 * CODE_LH + CODE_LH - 10}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill="var(--color-bg)"
              >
                → {returnedText}
              </text>
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* The frame: holds the x = 7 binding */}
        <AnimatePresence>
          {s.frameState !== "hidden" ? (
            <motion.g
              key="frame"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.smooth}
            >
              <rect
                x={FRAME_X}
                y={FRAME_Y}
                width={FRAME_W}
                height={FRAME_H}
                rx={3}
                fill={
                  s.frameState === "pinned"
                    ? "color-mix(in oklab, var(--color-accent) 10%, transparent)"
                    : "color-mix(in oklab, var(--color-surface) 70%, transparent)"
                }
                stroke={
                  s.frameState === "pinned"
                    ? "var(--color-accent)"
                    : "var(--color-rule)"
                }
                strokeWidth={1}
                strokeDasharray={s.frameState === "pinned" ? "0" : "3 3"}
              />
              <text
                x={FRAME_X + 10}
                y={FRAME_Y + 16}
                fontFamily="var(--font-sans)"
                fontSize={9}
                fill="var(--color-text-muted)"
                letterSpacing="0.08em"
              >
                FRAME: makeRemember
              </text>
              <text
                x={FRAME_X + 10}
                y={FRAME_Y + 42}
                fontFamily="var(--font-mono)"
                fontSize={13}
                fill="var(--color-text)"
              >
                x
              </text>
              <rect
                x={FRAME_X + 32}
                y={FRAME_Y + 30}
                width={30}
                height={22}
                rx={2}
                fill="var(--color-accent)"
              />
              <text
                x={FRAME_X + 47}
                y={FRAME_Y + 46}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={13}
                fill="var(--color-bg)"
              >
                7
              </text>
              {s.frameState === "pinned" ? (
                <text
                  x={FRAME_X + FRAME_W - 10}
                  y={FRAME_Y + 16}
                  textAnchor="end"
                  fontFamily="var(--font-sans)"
                  fontSize={9}
                  fill="var(--color-accent)"
                  letterSpacing="0.08em"
                >
                  PINNED
                </text>
              ) : null}
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* The returned function object */}
        <AnimatePresence>
          {s.showInnerFn ? (
            <motion.g
              key="fn"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.smooth}
            >
              <rect
                x={FN_X}
                y={FN_Y}
                width={FN_W}
                height={FN_H}
                rx={3}
                fill="color-mix(in oklab, var(--color-surface) 80%, transparent)"
                stroke="var(--color-text-muted)"
                strokeWidth={1}
              />
              <text
                x={FN_X + 10}
                y={FN_Y + 16}
                fontFamily="var(--font-sans)"
                fontSize={9}
                fill="var(--color-text-muted)"
                letterSpacing="0.08em"
              >
                FUNCTION OBJECT
              </text>
              <text
                x={FN_X + 10}
                y={FN_Y + 38}
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill="var(--color-text)"
              >
                code: () =&gt; x
              </text>
              <text
                x={FN_X + 10}
                y={FN_Y + 62}
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill="var(--color-text)"
              >
                [[Environment]]:
              </text>
              {/* Slot where the tether starts — ringed attachment point */}
              <circle
                cx={FN_X + FN_W - 16}
                cy={FN_Y + 58}
                r={9}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={1}
                opacity={0.5}
              />
              <motion.circle
                cx={FN_X + FN_W - 16}
                cy={FN_Y + 58}
                fill="var(--color-accent)"
                initial={false}
                animate={{ r: s.showTether ? 6 : 3 }}
                transition={SPRING.snappy}
              />
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* The tether — from the [[Environment]] slot to the frame */}
        {s.showTether && s.showInnerFn ? (
          <Arrow
            x1={FN_X + FN_W - 16}
            y1={FN_Y + 58}
            x2={FRAME_X + FRAME_W / 2}
            y2={FRAME_Y + FRAME_H}
            tone="active"
            strokeWidth={1.5}
            curvature={26}
            animateIn
          />
        ) : null}

        {/* Lookup walk — only drawn at call time */}
        {s.showLookup ? (
          <motion.g
            key="lookup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...SPRING.smooth, delay: 0.15 }}
          >
            <text
              x={FN_X + FN_W / 2}
              y={FN_Y - 8}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={10}
              fill="var(--color-accent)"
            >
              read x → 7
            </text>
          </motion.g>
        ) : null}

        {/* Legend at the very bottom */}
        <text
          x={WIDTH / 2}
          y={HEIGHT - 20}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={10}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          A CLOSURE = FUNCTION + TETHER TO ITS BIRTH SCOPE
        </text>
      </svg>
      </div>
      <div className="bs-tetherscope-narrow">
        <MemoNarrowTetherScope step={step} s={s} />
      </div>
    </WidgetShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                     Narrow portrait layout (mobile-first)                  */
/* -------------------------------------------------------------------------- */

/**
 * NarrowTetherScope — portrait composition. Code pane on top, runtime heap
 * underneath (frame above, returned function object below), and the tether
 * draws as a vertical curve from the function object's [[Environment]] slot
 * up to the pinned frame. The visual teaching — "this function is tethered
 * to this frame" — stays identical; the orientation flips so each element
 * can render at native size on 360 w.
 */
const MemoNarrowTetherScope = memo(NarrowTetherScope);

function NarrowTetherScope({ step, s }: { step: number; s: Step }) {
  const W = 360;
  const CODE_X = 16;
  const CODE_Y = 28;
  const CODE_LH = 20;
  const CODE_W = W - CODE_X * 2;
  const CODE_BOTTOM = CODE_Y + CODE_LINES.length * CODE_LH + 12;

  const RUNTIME_Y = CODE_BOTTOM + 16;
  const FRAME_X = 18;
  const FRAME_Y = RUNTIME_Y + 20;
  const FRAME_W = W - FRAME_X * 2;
  const FRAME_H = 68;

  const FN_Y = FRAME_Y + FRAME_H + 64;
  const FN_X = 18;
  const FN_W = W - FN_X * 2;
  const FN_H = 84;

  const H = FN_Y + FN_H + 36;

  const returnedText = s.returnValue !== null ? String(s.returnValue) : "";
  const fnSlotCx = FN_X + FN_W - 22;
  const fnSlotCy = FN_Y + FN_H - 20;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: W, height: "auto", display: "block" }}
      role="img"
      aria-label={`TetherScope: step ${step + 1} of ${STEPS.length}. ${s.caption}`}
    >
      {/* Code pane header */}
      <text
        x={CODE_X}
        y={14}
        fontFamily="var(--font-sans)"
        fontSize={9}
        fill="var(--color-text-muted)"
        letterSpacing="0.08em"
      >
        CODE
      </text>

      {/* Code lines */}
      {CODE_LINES.map((line, i) => {
        const y = CODE_Y + i * CODE_LH;
        const active = s.activeLines.includes(i);
        return (
          <g key={`n-line-${i}`}>
            {active ? (
              <motion.rect
                x={CODE_X - 4}
                y={y - 2}
                width={CODE_W}
                height={CODE_LH - 2}
                rx={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={SPRING.snappy}
                fill="color-mix(in oklab, var(--color-accent) 14%, transparent)"
              />
            ) : null}
            <text
              x={CODE_X}
              y={y + CODE_LH - 7}
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill={active ? "var(--color-text)" : "var(--color-text-muted)"}
            >
              {line || "\u00A0"}
            </text>
          </g>
        );
      })}

      {/* Return tag */}
      <AnimatePresence>
        {s.returnValue !== null ? (
          <motion.g
            key="n-return-tag"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.smooth}
          >
            <rect
              x={CODE_X + 120}
              y={CODE_Y + 8 * CODE_LH - 4}
              width={44}
              height={CODE_LH - 2}
              rx={2}
              fill="var(--color-accent)"
            />
            <text
              x={CODE_X + 142}
              y={CODE_Y + 8 * CODE_LH + CODE_LH - 9}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-bg)"
            >
              → {returnedText}
            </text>
          </motion.g>
        ) : null}
      </AnimatePresence>

      {/* Runtime divider */}
      <line
        x1={16}
        x2={W - 16}
        y1={RUNTIME_Y}
        y2={RUNTIME_Y}
        stroke="var(--color-rule)"
        strokeWidth={1}
        strokeDasharray="2 4"
      />
      <text
        x={CODE_X}
        y={RUNTIME_Y + 14}
        fontFamily="var(--font-sans)"
        fontSize={9}
        fill="var(--color-text-muted)"
        letterSpacing="0.08em"
      >
        RUNTIME
      </text>

      {/* Frame */}
      <AnimatePresence>
        {s.frameState !== "hidden" ? (
          <motion.g
            key="n-frame"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.smooth}
          >
            <rect
              x={FRAME_X}
              y={FRAME_Y}
              width={FRAME_W}
              height={FRAME_H}
              rx={3}
              fill={
                s.frameState === "pinned"
                  ? "color-mix(in oklab, var(--color-accent) 10%, transparent)"
                  : "color-mix(in oklab, var(--color-surface) 70%, transparent)"
              }
              stroke={
                s.frameState === "pinned"
                  ? "var(--color-accent)"
                  : "var(--color-rule)"
              }
              strokeWidth={1}
              strokeDasharray={s.frameState === "pinned" ? "0" : "3 3"}
            />
            <text
              x={FRAME_X + 10}
              y={FRAME_Y + 16}
              fontFamily="var(--font-sans)"
              fontSize={9}
              fill="var(--color-text-muted)"
              letterSpacing="0.08em"
            >
              FRAME: makeRemember
            </text>
            <text
              x={FRAME_X + 10}
              y={FRAME_Y + 44}
              fontFamily="var(--font-mono)"
              fontSize={13}
              fill="var(--color-text)"
            >
              x
            </text>
            <rect
              x={FRAME_X + 32}
              y={FRAME_Y + 32}
              width={30}
              height={22}
              rx={2}
              fill="var(--color-accent)"
            />
            <text
              x={FRAME_X + 47}
              y={FRAME_Y + 48}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={13}
              fill="var(--color-bg)"
            >
              7
            </text>
            {s.frameState === "pinned" ? (
              <text
                x={FRAME_X + FRAME_W - 10}
                y={FRAME_Y + 16}
                textAnchor="end"
                fontFamily="var(--font-sans)"
                fontSize={9}
                fill="var(--color-accent)"
                letterSpacing="0.08em"
              >
                PINNED
              </text>
            ) : null}
          </motion.g>
        ) : null}
      </AnimatePresence>

      {/* Function object */}
      <AnimatePresence>
        {s.showInnerFn ? (
          <motion.g
            key="n-fn"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.smooth}
          >
            <rect
              x={FN_X}
              y={FN_Y}
              width={FN_W}
              height={FN_H}
              rx={3}
              fill="color-mix(in oklab, var(--color-surface) 80%, transparent)"
              stroke="var(--color-text-muted)"
              strokeWidth={1}
            />
            <text
              x={FN_X + 10}
              y={FN_Y + 16}
              fontFamily="var(--font-sans)"
              fontSize={9}
              fill="var(--color-text-muted)"
              letterSpacing="0.08em"
            >
              FUNCTION OBJECT
            </text>
            <text
              x={FN_X + 10}
              y={FN_Y + 38}
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-text)"
            >
              code: () =&gt; x
            </text>
            <text
              x={FN_X + 10}
              y={FN_Y + 60}
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-text)"
            >
              [[Environment]]:
            </text>
            <circle
              cx={fnSlotCx}
              cy={fnSlotCy}
              r={9}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={1}
              opacity={0.5}
            />
            <motion.circle
              cx={fnSlotCx}
              cy={fnSlotCy}
              fill="var(--color-accent)"
              initial={false}
              animate={{ r: s.showTether ? 6 : 3 }}
              transition={SPRING.snappy}
            />
          </motion.g>
        ) : null}
      </AnimatePresence>

      {/* Vertical tether: from fn's [[Environment]] slot UP to the frame */}
      {s.showTether && s.showInnerFn ? (
        <Arrow
          x1={fnSlotCx}
          y1={fnSlotCy}
          x2={FRAME_X + FRAME_W - 30}
          y2={FRAME_Y + FRAME_H}
          tone="active"
          strokeWidth={1.5}
          curvature={-22}
          animateIn
        />
      ) : null}

      {/* Lookup label */}
      {s.showLookup ? (
        <motion.g
          key="n-lookup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SPRING.smooth, delay: 0.15 }}
        >
          <text
            x={FN_X + FN_W / 2}
            y={FN_Y - 8}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-accent)"
          >
            read x → 7
          </text>
        </motion.g>
      ) : null}

      <text
        x={W / 2}
        y={H - 8}
        textAnchor="middle"
        fontFamily="var(--font-sans)"
        fontSize={9}
        fill="var(--color-text-muted)"
        letterSpacing="0.06em"
      >
        CLOSURE = FUNCTION + TETHER
      </text>
    </svg>
  );
}
