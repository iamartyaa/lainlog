"use client";

import { MediaBetweenText } from "@/components/fancy";

const TRANSITION = { type: "spring" as const, duration: 1, bounce: 0 };

/**
 * MediaBetweenText slot A — Scene 1 opening hook.
 *
 *   "Same prompt, two runs, two different answers — [chip A ⇄ B]."
 *
 * The chip is a small terracotta tile. It is the punchline of the sentence —
 * the model, twice, on the same input, two different outputs. The chip
 * widens-into-place on inView (once) so the beat lands at reading pace.
 *
 * Wrapped in a "use client" component because MediaBetweenText needs a
 * function `renderMedia` prop and the hosting page.tsx is an RSC.
 */
export function RentChipReveal() {
  return (
    <MediaBetweenText
      firstText="Same model. Same prompt. "
      secondText=" Different output."
      triggerType="inView"
      useInViewOptionsProp={{ once: true, amount: 0.6 }}
      mediaContainerClassName="align-middle mx-[6px]"
      animationVariants={{
        initial: { width: 0, opacity: 0 },
        animate: {
          width: 132,
          opacity: 1,
          transition: TRANSITION,
        },
      }}
      renderMedia={() => (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 132,
            height: 20,
            borderRadius: 4,
            background:
              "color-mix(in oklab, var(--color-accent) 22%, transparent)",
            border: "1px solid var(--color-rule)",
            lineHeight: "18px",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--color-text)",
            letterSpacing: "0.02em",
            verticalAlign: "middle",
          }}
        >
          two different answers
        </span>
      )}
    />
  );
}
