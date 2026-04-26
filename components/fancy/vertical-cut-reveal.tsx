"use client";

import {
  ElementType,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  Transition,
  useInView,
  UseInViewOptions,
} from "motion/react";

import { cn } from "@/lib/utils/cn";

type Segment = {
  chars: string[];
  trailingSpace: boolean;
};

type Trigger = "auto" | "inView" | "ref";

export type VerticalCutRevealRef = {
  animate: () => void;
  reset: () => void;
};

type Props = {
  children: string;
  as?: ElementType;
  className?: string;
  transition?: Transition;
  triggerType?: Trigger;
  useInViewOptions?: UseInViewOptions;
  /**
   * Stagger between adjacent characters, seconds. DESIGN.md §9: default 60ms.
   */
  staggerDuration?: number;
  /**
   * Stagger applied between top-level word boundaries. Scales slower than
   * the per-char stagger so the word rhythm stays readable.
   */
  staggerFrom?: "first" | "last";
};

function segment(text: string): Segment[] {
  return text
    .split(/(\s+)/)
    .filter((chunk) => chunk.length > 0)
    .reduce<Segment[]>((acc, chunk) => {
      if (/^\s+$/.test(chunk)) {
        const prev = acc[acc.length - 1];
        if (prev) prev.trailingSpace = true;
        return acc;
      }
      acc.push({ chars: [...chunk], trailingSpace: false });
      return acc;
    }, []);
}

/**
 * VerticalCutReveal — each letter slides up from a clipped baseline, staggered
 * across the line. Motion uses `transform: translateY` + `opacity` only
 * (DESIGN.md §9). Overflow-clipped container hides the pre-reveal state.
 *
 * Used in lainlog for one-shot climax moments (e.g. a post's thesis
 * sentence). Not ambient. Reduced-motion is handled globally by
 * MotionConfig reducedMotion="user" — transforms collapse to instant.
 */
export const VerticalCutReveal = forwardRef<VerticalCutRevealRef, Props>(
  function VerticalCutReveal(
    {
      children,
      as,
      className,
      transition = { type: "spring", duration: 0.9, bounce: 0 },
      triggerType = "inView",
      useInViewOptions = { once: true, initial: false, amount: 0.55 },
      staggerDuration = 0.06,
      staggerFrom = "first",
    },
    ref,
  ) {
    const componentRef = useRef<HTMLElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const inViewHook = useInView(componentRef, useInViewOptions);
    const isInView = triggerType === "inView" ? inViewHook : false;

    useEffect(() => {
      if (triggerType === "auto") setIsAnimating(true);
    }, [triggerType]);

    useImperativeHandle(ref, () => ({
      animate: () => setIsAnimating(true),
      reset: () => setIsAnimating(false),
    }));

    const shouldAnimate =
      triggerType === "inView"
        ? isInView
        : triggerType === "ref"
          ? isAnimating
          : triggerType === "auto"
            ? isAnimating
            : false;

    const segments = useMemo(() => segment(children), [children]);
    const totalChars = useMemo(
      () => segments.reduce((n, s) => n + s.chars.length, 0),
      [segments],
    );

    const ElementTag = (as || "span") as ElementType;
    let charIndex = 0;

    return (
      <ElementTag ref={componentRef} className={cn("inline-block", className)}>
        {segments.map((seg, wi) => (
          <span
            key={wi}
            className="inline-flex whitespace-nowrap overflow-hidden align-baseline"
            aria-hidden="true"
          >
            {seg.chars.map((ch, ci) => {
              const idx =
                staggerFrom === "first"
                  ? charIndex++
                  : totalChars - 1 - charIndex++;
              const delay = idx * staggerDuration;
              return (
                <motion.span
                  key={ci}
                  className="inline-block"
                  initial={{ y: "120%", opacity: 0 }}
                  animate={
                    shouldAnimate
                      ? { y: "0%", opacity: 1 }
                      : { y: "120%", opacity: 0 }
                  }
                  transition={{ ...transition, delay } as Transition}
                >
                  {ch}
                </motion.span>
              );
            })}
            {seg.trailingSpace ? <span>&nbsp;</span> : null}
          </span>
        ))}
        {/* Screen readers get the full text, motion is hidden from them. */}
        <span className="sr-only">{children}</span>
      </ElementTag>
    );
  },
);

VerticalCutReveal.displayName = "VerticalCutReveal";

export default VerticalCutReveal;
