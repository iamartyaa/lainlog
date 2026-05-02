"use client";

import { MediaBetweenText } from "@/components/fancy";

const TRANSITION = { type: "spring" as const, duration: 1, bounce: 0 };

/**
 * MediaBetweenText slot B — Scene 4 mid-post.
 *
 *   "If every wine on your panel scores 95, [chip ballot] your panel
 *    isn't tasting hard enough."
 *
 * The chip is a terracotta tasting-ballot row — five small dots, all
 * filled, the visual punchline of "every wine scores 95." It carries the
 * wine-panel lens visually for the only time outside prose.
 */
export function BallotChipReveal() {
  return (
    <MediaBetweenText
      firstText="If every wine on your panel scores 95, "
      secondText=" your panel isn't tasting hard enough."
      triggerType="inView"
      useInViewOptionsProp={{ once: true, amount: 0.6 }}
      mediaContainerClassName="align-middle mx-[6px]"
      animationVariants={{
        initial: { width: 0, opacity: 0 },
        animate: {
          width: 64,
          opacity: 1,
          transition: TRANSITION,
        },
      }}
      renderMedia={() => (
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            width: 64,
            height: 20,
            borderRadius: 4,
            background:
              "color-mix(in oklab, var(--color-accent) 12%, transparent)",
            border: "1px solid var(--color-rule)",
            verticalAlign: "middle",
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--color-accent)",
                opacity: 0.85 - i * 0.04,
              }}
            />
          ))}
        </span>
      )}
    />
  );
}
