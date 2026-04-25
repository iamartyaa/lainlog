"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils/cn";

type ScrambleInProps = {
  /** Final string. Displayed immediately under reduced-motion. */
  text: string;
  /** ms between character ticks. Default 60 (DESIGN.md §9 stagger budget). */
  scrambleSpeed?: number;
  /** Number of scrambled characters held after the reveal before settling. */
  scrambledLetterCount?: number;
  /** Glyph alphabet used for scrambled characters. */
  characters?: string;
  className?: string;
  scrambledClassName?: string;
  /** Start on mount. Default true; set false and drive via the imperative ref. */
  autoStart?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
};

export type ScrambleInRef = {
  start: () => void;
  reset: () => void;
};

/**
 * ScrambleIn — progressive character reveal with a brief scrambled tail.
 *
 * Teaching payload: a stable token, decoded in place. Used on the
 * NormalisationMap canonical chip to dramatise the rewrite-on-read moment —
 * every time the reader picks a new typed row, the canonical form scrambles
 * back into focus.
 *
 * DESIGN.md §9: the setInterval is gated by `useReducedMotion()`; under
 * `prefers-reduced-motion` the component renders `text` directly, no ticks.
 */
export const ScrambleIn = forwardRef<ScrambleInRef, ScrambleInProps>(
  function ScrambleIn(
    {
      text,
      scrambleSpeed = 60,
      scrambledLetterCount = 2,
      characters = "abcdefghijklmnopqrstuvwxyz0123456789.@+",
      className,
      scrambledClassName,
      autoStart = true,
      onStart,
      onComplete,
    },
    ref,
  ) {
    const reduced = useReducedMotion();

    const [visibleLetterCount, setVisibleLetterCount] = useState(
      reduced ? text.length : 0,
    );
    const [scrambleOffset, setScrambleOffset] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [scrambledTail, setScrambledTail] = useState("");

    const start = useCallback(() => {
      if (reduced) {
        setVisibleLetterCount(text.length);
        setScrambleOffset(scrambledLetterCount);
        setScrambledTail("");
        onStart?.();
        onComplete?.();
        return;
      }
      setIsAnimating(true);
      setVisibleLetterCount(0);
      setScrambleOffset(0);
      onStart?.();
    }, [reduced, text.length, scrambledLetterCount, onStart, onComplete]);

    const reset = useCallback(() => {
      setIsAnimating(false);
      setVisibleLetterCount(reduced ? text.length : 0);
      setScrambleOffset(0);
      setScrambledTail("");
    }, [reduced, text.length]);

    useImperativeHandle(ref, () => ({ start, reset }), [start, reset]);

    // Re-start whenever `text` changes so the canonical chip scrambles on each
    // typed-row switch. The ref imperative still works for controlled replays.
    useEffect(() => {
      if (autoStart) start();
    }, [autoStart, text, start]);

    useEffect(() => {
      if (!isAnimating || reduced) return;

      const interval = setInterval(() => {
        if (visibleLetterCount < text.length) {
          setVisibleLetterCount((n) => n + 1);
        } else if (scrambleOffset < scrambledLetterCount) {
          setScrambleOffset((n) => n + 1);
        } else {
          setIsAnimating(false);
          onComplete?.();
          return;
        }

        const remaining = Math.max(0, text.length - visibleLetterCount);
        const count = Math.min(remaining, scrambledLetterCount);
        const tail = Array.from({ length: count }, () =>
          characters[Math.floor(Math.random() * characters.length)],
        ).join("");
        setScrambledTail(tail);
      }, scrambleSpeed);

      return () => clearInterval(interval);
    }, [
      isAnimating,
      reduced,
      text,
      visibleLetterCount,
      scrambleOffset,
      scrambledLetterCount,
      characters,
      scrambleSpeed,
      onComplete,
    ]);

    const revealed = text.slice(0, visibleLetterCount);
    const scrambled = reduced ? "" : scrambledTail;

    return (
      <>
        <span className="sr-only">{text}</span>
        <span className="inline-block whitespace-pre-wrap" aria-hidden="true">
          <span className={cn(className)}>{revealed}</span>
          <span className={cn(scrambledClassName)}>{scrambled}</span>
        </span>
      </>
    );
  },
);
