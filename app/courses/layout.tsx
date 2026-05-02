import type { ReactNode } from "react";
import "@/components/courses/course-canvas.css";
import { CozyFrameProvider } from "@/components/nav/CozyFrame";
import CourseBackground from "./CourseBackground";

/**
 * /courses/* segment layout — dot-field background system.
 *
 * Two responsibilities:
 *
 *   1. Render <CourseBackground /> once at the segment root. It dispatches
 *      by pathname depth — landing pages mount DotField (cursor-reactive
 *      canvas), chapter pages get a static radial-gradient dot pattern.
 *      Both wrappers are fixed-position, behind content, pointer-events:none.
 *
 *   2. Wrap children in <CozyFrameProvider transparent>. The root layout's
 *      <CozyFrame> reads this context and drops its solid --color-bg fill,
 *      so the dot field shows through behind the centred column. Posts
 *      and the homepage never see this provider — their CozyFrame paints
 *      solid as before.
 *
 * The previous react.gg-style 40px gridline pattern (components/courses/
 * course-canvas.css) is superseded by this system; the rule has been
 * dropped from that stylesheet. The `bs-course-canvas` class lives on
 * the inner <div> for backward-compat (no current consumers, but the
 * class is referenced in upstream comments).
 *
 * The `[data-course]` token scope (--clay-* tonal range) is unaffected
 * — it lives on the inner page wrapper and continues to resolve as
 * before.
 */
export default function CoursesLayout({ children }: { children: ReactNode }) {
  return (
    <CozyFrameProvider transparent>
      <CourseBackground />
      <div className="bs-course-canvas min-h-dvh">{children}</div>
    </CozyFrameProvider>
  );
}
