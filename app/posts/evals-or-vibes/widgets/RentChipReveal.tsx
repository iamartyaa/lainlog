"use client";

import { MediaBetweenText } from "@/components/fancy";

const TRANSITION = { type: "spring" as const, duration: 1, bounce: 0 };

/**
 * MediaBetweenText slot A — Scene 1 opening hook.
 *
 *   "The same model said the rent was [chip $1,800 → $4,200] two days apart."
 *
 * The chip is a small terracotta tile. It is the punchline of the sentence —
 * the model, twice, on the same listing, two different rents. The chip
 * widens-into-place on inView (once) so the beat lands at reading pace.
 *
 * Wrapped in a "use client" component because MediaBetweenText needs a
 * function `renderMedia` prop and the hosting page.tsx is an RSC.
 */
export function RentChipReveal() {
  return (
    <MediaBetweenText
      firstText="The same model said the rent was "
      secondText=" two days apart."
      triggerType="inView"
      useInViewOptionsProp={{ once: true, amount: 0.6 }}
      mediaContainerClassName="align-middle mx-[6px]"
      animationVariants={{
        initial: { width: 0, opacity: 0 },
        animate: {
          width: 96,
          opacity: 1,
          transition: TRANSITION,
        },
      }}
      renderMedia={() => (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 96,
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
          $1,800 → $4,200
        </span>
      )}
    />
  );
}
