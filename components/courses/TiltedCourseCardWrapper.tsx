"use client";

import type { ReactNode } from "react";
import TiltedCard from "./TiltedCard";

/**
 * TiltedCourseCardWrapper — polish-r2 ITEM 6 + ITEM 4.
 *
 * Wraps the home pinned <CourseCard /> with a TiltedCard tilt-on-hover
 * effect tuned to bytesize's editorial calm:
 *   - rotateAmplitude={6}  — gentle, ~half the React Bits default of 14.
 *   - scaleOnHover={1.03}  — barely-perceptible lift; combined with the
 *     z-index lift (ITEM 4) the card reads "premium, but not busy".
 *   - showMobileWarning={false}, showTooltip={false} — the tilt is a
 *     desktop affordance; we don't advertise it.
 *
 * ITEM-4 z-index lift lives in CSS (.bs-course-card-lift) on the wrapper:
 *   - Always-on z-index: 1 elevation above the post-row stack.
 *   - Subtle shadow (transform-only on hover) cues "this is a course".
 *   - Mobile-first: same z-index lift on mobile (the card is the only
 *     pinned row, so there's no rhythm to break); the tilt + shadow
 *     are gated to (hover: hover) and (min-width: 30rem).
 *
 * The wrapper takes the CourseCard as children (TiltedCard's children-prop
 * adaptation), so the underlying <a> stays a real focusable link.
 *
 * Tilt is suppressed under prefers-reduced-motion (handled inside
 * TiltedCard via useReducedMotion). The card is keyboard-focusable
 * regardless (the link is the focus target, not the figure wrapper).
 */
export function TiltedCourseCardWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="bs-course-card-lift">
      <TiltedCard
        scaleOnHover={1.03}
        rotateAmplitude={6}
        showMobileWarning={false}
        showTooltip={false}
        containerWidth="100%"
      >
        {children}
      </TiltedCard>
    </div>
  );
}
