"use client";

/**
 * ScriptedGazeEyes — playful directed-gaze ornament that pulls the
 * reader's eye toward the reader-count below. Default shape is the
 * googly-eye look (oversized r=9 pupil inside r=18 disc — ~50% ratio,
 * tuned playful, not subtle).
 *
 * Choreography (one ~10 s loop):
 *
 *   1. look left, look right, settle   (~2.4 s) — one playful scan
 *   2. rest at the reader (forward)    (~1 s)
 *   3. squint to half-closed, hold     (~1.5 s)
 *   4. POP: pupil enlarge + eye grows + drop downward, all at once,
 *      quick (~0.4 s)                          — the "look here!" beat
 *   5. hold gaze on the reader-count   (~1.3 s)
 *   6. ease back to forward            (~1 s)
 *   7. brief rest at center            (~1.5 s)
 *
 * Reduced-motion: under `prefers-reduced-motion: reduce` both keyframe
 * loops are paused; eyes mount in the look-forward state.
 *
 * Color contract: `--eye-color`, `--eye-outline-color`,
 * `--eye-outline-width`, `--pupil-color` consumed from the surrounding
 * cascade so theme switches don't bleed raw hex into this file.
 */
import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ScriptedGazeEyesProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** total loop duration. default '10s' */
  duration?: string;
};

export function ScriptedGazeEyes({
  duration = "10s",
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
        style={{ overflow: "visible" }}
      >
        {/* Left eye group — squint scales from the eye's own center. */}
        <g
          className="seg-eye seg-eye-left"
          style={{ transformOrigin: "20px 20px" }}
        >
          <ellipse cx="20" cy="20" rx="18" ry="18" />
          <circle className="seg-pupil" cx="20" cy="20" r="9" />
        </g>
        {/* Right eye group */}
        <g
          className="seg-eye seg-eye-right"
          style={{ transformOrigin: "70px 20px" }}
        >
          <ellipse cx="70" cy="20" rx="18" ry="18" />
          <circle className="seg-pupil" cx="70" cy="20" r="9" />
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
          animation: scripted-gaze-pupil var(--gaze-duration) infinite cubic-bezier(0.45, 0, 0.55, 1);
        }
        .scripted-gaze-eyes svg .seg-eye {
          transform-box: fill-box;
          animation: scripted-gaze-shape var(--gaze-duration) infinite cubic-bezier(0.45, 0, 0.55, 1);
        }

        /* Pupil — single L→R→center scan, then squint hold, then POP+drop */
        @keyframes scripted-gaze-pupil {
          0%   { transform: translate(0, 0) scale(1); }    /* rest */
          8%   { transform: translate(-8px, 0) scale(1); } /* look left */
          16%  { transform: translate(-8px, 0) scale(1); } /* hold left */
          24%  { transform: translate(8px, 0) scale(1); }  /* look right */
          32%  { transform: translate(8px, 0) scale(1); }  /* hold right */
          40%  { transform: translate(0, 0) scale(1); }    /* settle on reader */
          50%  { transform: translate(0, 0) scale(1); }    /* rest ~1 s */
          58%  { transform: translate(0, 0) scale(1); }    /* squinting (pupil holds) */
          70%  { transform: translate(0, 0) scale(1); }    /* still squinted */
          74%  { transform: translate(0, 8px) scale(1.45); } /* POP: enlarge + drop */
          85%  { transform: translate(0, 8px) scale(1.45); } /* hold down */
          93%  { transform: translate(0, 0) scale(1); }    /* ease back */
          100% { transform: translate(0, 0) scale(1); }    /* rest */
        }

        /* Eye shape — half-squint scaleY 0.5 hold; small scale-up during POP */
        @keyframes scripted-gaze-shape {
          0%, 50%   { transform: scaleY(1); }
          54%       { transform: scaleY(0.75); }                   /* easing into squint */
          58%       { transform: scaleY(0.5); }                    /* half-squinted */
          70%       { transform: scaleY(0.5); }                    /* held half-closed */
          74%       { transform: scaleY(1) scale(1.10); }          /* POP: snap open + small grow */
          85%       { transform: scaleY(1) scale(1.10); }          /* hold enlarged */
          93%       { transform: scaleY(1) scale(1); }             /* return */
          100%      { transform: scaleY(1) scale(1); }
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
