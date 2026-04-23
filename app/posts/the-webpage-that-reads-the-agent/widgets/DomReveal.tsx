"use client";

import { MediaBetweenText } from "@/components/fancy";

const TRANSITION = { type: "spring" as const, duration: 1, bounce: 0 };

/**
 * A single inline MediaBetweenText reveal used once in §3. The chip is a
 * tiny terracotta tile labelled "dom" — shorthand for "the agent reads the
 * DOM, you read the render." Lives in its own client component so the
 * page.tsx RSC doesn't have to serialise a renderMedia function across
 * the server/client boundary.
 */
export function DomReveal() {
  return (
    <MediaBetweenText
      firstText="the page humans see "
      secondText=" hides a different page for the agent."
      triggerType="inView"
      useInViewOptionsProp={{ once: true, amount: 0.6 }}
      mediaContainerClassName="align-middle mx-[6px]"
      animationVariants={{
        initial: { width: 0, opacity: 0 },
        animate: {
          width: 36,
          opacity: 1,
          transition: TRANSITION,
        },
      }}
      renderMedia={() => (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 36,
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
          dom
        </span>
      )}
    />
  );
}
