"use client";

import type { ReactNode } from "react";
import TiltedCard from "./TiltedCard";

/**
 * TiltedCourseCardWrapper — polish-r2 ITEM 6 + ITEM 4 + polish-r3 ITEM 2.
 *
 * Wraps the home pinned <CourseCard /> with a TiltedCard tilt-on-hover
 * effect tuned to bytesize's editorial calm:
 *   - rotateAmplitude={6}  — gentle, ~half the React Bits default of 14.
 *   - scaleOnHover={1.03}  — barely-perceptible lift; combined with the
 *     z-index lift (ITEM 4) the card reads "premium, but not busy".
 *   - showMobileWarning={false}, showTooltip={false} — the tilt is a
 *     desktop affordance; we don't advertise it.
 *
 * ITEM-4 z-index lift + polish-r3 ITEM 2 elevation/shade/border live in CSS
 * (.bs-course-card-lift) on the wrapper:
 *   - Always-on z-index: 1 elevation above the post-row stack.
 *   - polish-r3: at-rest static box-shadow elevates the card above the
 *     post rows BEFORE hover (was hover-only filter in r2).
 *   - polish-r3: tonal terracotta shade via --clay-50 (light) / --clay-100
 *     (dark) — distinct from the post-list rows + page bg without
 *     introducing a second accent. Resolved via the `data-course` attribute
 *     applied to the wrapper, which scopes course-canvas.css's --clay-*
 *     tokens to this single card.
 *   - polish-r3: minimalist 1-px solid border in --clay-200 (or
 *     --color-rule fallback) with --radius-md corners. Replaces the
 *     dashed top + bottom rules previously painted INSIDE the CourseCard
 *     (those rules are dropped via the `data-on-tilted-card` attribute on
 *     the same wrapper, which CourseCard reads to suppress its own dashed
 *     rules — see CourseCard.tsx for the conditional).
 *   - Mobile-first: same z-index lift, shade, border, at-rest shadow all
 *     apply at every breakpoint. The tilt is the only desktop-only
 *     affordance (gated to hover-capable pointers).
 *
 * The wrapper takes the CourseCard as children (TiltedCard's children-prop
 * adaptation), so the underlying <a> stays a real focusable link.
 *
 * Tilt is suppressed under prefers-reduced-motion (handled inside
 * TiltedCard via useReducedMotion). The at-rest shadow is static — no
 * animation — so it remains visible under reduced-motion. The card is
 * keyboard-focusable regardless (the link is the focus target, not the
 * figure wrapper).
 *
 * TiltedCard preserve-3d safety: the figure (.tilted-card-figure) carries
 * the perspective; .tilted-card-inner carries preserve-3d + the rotation
 * transform; the children render INSIDE .tilted-card-children which sits
 * underneath. The border, shade, and shadow live on this OUTER wrapper
 * (bs-course-card-lift), one level above the figure — they are not
 * subjected to the 3D tilt and never clip during rotation.
 */
export function TiltedCourseCardWrapper({ children }: { children: ReactNode }) {
  return (
    // data-course scopes the --clay-* tonal terracotta tokens locally to
    // this card so the shade + border resolve without leaking elsewhere.
    // data-on-tilted-card is read by CourseCard to suppress its own
    // dashed top/bottom rules (the wrapper's full minimalist border
    // takes over the bracketing job).
    <div className="bs-course-card-lift" data-course data-on-tilted-card>
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
