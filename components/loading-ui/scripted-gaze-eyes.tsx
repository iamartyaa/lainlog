"use client";

/**
 * ScriptedGazeEyes — a purpose-built directed-gaze ornament for the
 * desktop AboutColumn slot. Unlike the vendored WanderingEyes (random
 * wandering + ambient blink), this component runs an 8-phase scripted
 * sequence that pulls the reader's eye toward the reader-count matrix
 * sitting just below it:
 *
 *   1. look right        (1.6 s)
 *   2. look left         (1.6 s)
 *   3. look forward      (1.0 s)  — gaze settles on the reader
 *   4. squint            (1.0 s)  — recognition beat
 *   5. enlarge pupil     (1.2 s)  — "wait, *you*?"
 *   6. look down         (0.8 s)  — track toward reader-count
 *   7. hold on count     (4.0 s)  — rest on the matrix below
 *   8. return to forward (1.0 s)
 *
 * Total ≈ 12.2 s of motion inside a 14 s loop (the eased return adds
 * the remaining seconds of breathing room). Callers tune via the
 * `--gaze-duration` CSS custom property exposed through the `duration`
 * prop.
 *
 * Color contract matches WanderingEyes — reads `--eye-color`,
 * `--eye-outline-color`, `--eye-outline-width`, `--pupil-color` from
 * its container so theme switches don't bleed raw hex into this file.
 *
 * Reduced-motion: under `prefers-reduced-motion: reduce` both
 * keyframe animations are paused, so the eyes mount in their
 * look-forward state with zero ambient cadence.
 */
import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ScriptedGazeEyesProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** total loop duration. default '14s' */
  duration?: string;
};

export function ScriptedGazeEyes({
  duration = "14s",
  className,
  style,
  ...rest
}: ScriptedGazeEyesProps) {
  return (
    <span
      role="presentation"
      className={cn("scripted-gaze-eyes inline-block", className)}
      style={
        {
          "--gaze-duration": duration,
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      <svg
        viewBox="0 0 90 40"
        width="100%"
        height="100%"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Left eye group — squint scales from the eye's own center. */}
        <g
          className="seg-eye seg-eye-left"
          style={{ transformOrigin: "20px 20px" }}
        >
          <ellipse cx="20" cy="20" rx="18" ry="18" />
          <circle className="seg-pupil" cx="20" cy="20" r="6" />
        </g>
        {/* Right eye group */}
        <g
          className="seg-eye seg-eye-right"
          style={{ transformOrigin: "70px 20px" }}
        >
          <ellipse cx="70" cy="20" rx="18" ry="18" />
          <circle className="seg-pupil" cx="70" cy="20" r="6" />
        </g>
      </svg>

      <style>{`
        .scripted-gaze-eyes svg ellipse {
          fill: var(--eye-color, #fff);
          stroke: var(--eye-outline-color, transparent);
          stroke-width: var(--eye-outline-width, 0);
        }
        .scripted-gaze-eyes svg .seg-pupil {
          fill: var(--pupil-color, #000);
          transform-box: fill-box;
          transform-origin: center;
          animation: scripted-gaze-move var(--gaze-duration) infinite cubic-bezier(0.45, 0, 0.55, 1);
        }
        .scripted-gaze-eyes svg .seg-eye {
          transform-box: fill-box;
          animation: scripted-gaze-squint var(--gaze-duration) infinite cubic-bezier(0.45, 0, 0.55, 1);
        }

        @keyframes scripted-gaze-move {
          0%   { transform: translate(0,0) scale(1); }     /* start: center */
          11%  { transform: translate(8px,0) scale(1); }   /* phase 1: right */
          22%  { transform: translate(8px,0) scale(1); }   /* hold right */
          33%  { transform: translate(-8px,0) scale(1); }  /* phase 2: left */
          44%  { transform: translate(-8px,0) scale(1); }  /* hold left */
          51%  { transform: translate(0,0) scale(1); }     /* phase 3: forward */
          58%  { transform: translate(0,0) scale(1); }     /* phase 4: squint (pupil holds) */
          67%  { transform: translate(0,0) scale(1.45); }  /* phase 5: enlarge */
          72%  { transform: translate(0,0) scale(1.45); }  /* hold enlarged */
          78%  { transform: translate(0,10px) scale(1); }  /* phase 6: down */
          93%  { transform: translate(0,10px) scale(1); }  /* phase 7: hold down */
          100% { transform: translate(0,0) scale(1); }     /* phase 8: return */
        }

        @keyframes scripted-gaze-squint {
          0%, 51%   { transform: scaleY(1); }
          58%       { transform: scaleY(0.4); }   /* squint */
          67%       { transform: scaleY(0.85); }  /* slight reopen with enlarged pupil */
          72%       { transform: scaleY(0.85); }
          78%       { transform: scaleY(1); }
          100%      { transform: scaleY(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .scripted-gaze-eyes svg .seg-pupil,
          .scripted-gaze-eyes svg .seg-eye {
            animation: none !important;
          }
        }
      `}</style>
    </span>
  );
}
