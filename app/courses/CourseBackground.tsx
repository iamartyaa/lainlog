"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

/**
 * CourseBackground — segment-layout dispatcher for the course-routes
 * dotted-background system.
 *
 * Branches by pathname depth:
 *   /courses                 → returns null (the courses index, if any,
 *                              keeps the default body hatch).
 *   /courses/<slug>          → landing page → mount DotField (cursor-
 *                              reactive canvas) inside a static-dots
 *                              fallback wrapper. The fallback gradient
 *                              shows through if DotField bails out
 *                              (mobile / localStorage off / SSR).
 *   /courses/<slug>/<chap>   → chapter page → static radial-gradient dots
 *                              only, no canvas, no listeners.
 *
 * Both wrappers are `position: fixed; inset: 0; z-index: -1;
 * pointer-events: none` (see app/globals.css `.bs-course-bg-static` and
 * `.bs-course-bg-canvas`). Cursor events pass through to the content.
 *
 * DotField is `next/dynamic({ ssr: false })` — the component is canvas-
 * heavy and uses `window`/`document`/`getComputedStyle`/`localStorage`
 * during initialization, none of which exist on the server.
 */

const DotField = dynamic(
  () => import("@/components/fancy/dot-field/DotField"),
  { ssr: false },
);

export default function CourseBackground() {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  // ["courses"]               → 1 (no background)
  // ["courses", slug]         → 2 (landing → DotField)
  // ["courses", slug, chap]   → 3+ (chapter → static dots)
  const isLanding = segments.length === 2 && segments[0] === "courses";
  const isChapter = segments.length >= 3 && segments[0] === "courses";

  if (isChapter) {
    return <div className="bs-course-bg-static" aria-hidden="true" />;
  }
  if (isLanding) {
    return (
      <div className="bs-course-bg-canvas" aria-hidden="true">
        <DotField />
      </div>
    );
  }
  return null;
}
