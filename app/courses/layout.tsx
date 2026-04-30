import type { ReactNode } from "react";
import "@/components/courses/course-canvas.css";

/**
 * /courses/* segment layout — polish-r5 ITEM 3 + ITEM 4.
 *
 * Two bugs converge on this layout:
 *
 *   ITEM 3 (gridline coverage). Previously the react.gg-style gridline
 *   pattern was painted on `[data-course]` — but that attribute lives on
 *   the inner page-content wrapper inside each course page, which only
 *   spans its own height (post-back-link → hero, or chapter prose). On
 *   short content (course landing) the gridlines stopped well short of
 *   the viewport bottom. The fix is to move the pattern onto a viewport-
 *   spanning surface — this layout's wrapper at `min-h-dvh`.
 *
 *   ITEM 4 (gridline leak on home). The home pinned course card carries
 *   `data-course` (so the --clay-* tonal range resolves on it). The old
 *   gridline rule `[data-course] { background-image: ... }` therefore
 *   matched the home card too — and after navigating into a course and
 *   back, the gridline pattern showed up under the home card. The fix
 *   below scopes the pattern to `.bs-course-canvas` instead of
 *   `[data-course]`. The home card never carries that class — so the
 *   pattern can't leak.
 *
 * The class lives on this layout's <div> which spans `min-h-dvh`, giving
 * us full-viewport coverage on every /courses/* route automatically (no
 * per-page wiring required). The `[data-course]` attribute on the inner
 * page wrapper continues to host the --clay-* token scope; it is not the
 * gridline trigger any more.
 */
export default function CoursesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bs-course-canvas min-h-dvh">
      {children}
    </div>
  );
}
