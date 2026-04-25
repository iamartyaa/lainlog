import type { ReactNode } from "react";

/**
 * PostList wrappers — plain semantic <ul>/<li> with no entrance animation.
 *
 * Earlier revisions used motion/react to fade rows in on mount. That fired
 * on every back-navigation to home, which read as a "page reload" even at
 * 260ms. The hero choreography in AboutColumn (wordmark, paragraph) carries
 * first-visit branding; the article list is content and renders instantly.
 *
 * Kept as named exports (MotionList / MotionItem) so the PostList import
 * stays stable; the names are now historical. delayChildren is accepted
 * and ignored to preserve the call-site signature.
 */

export function MotionList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
}) {
  return <ul className={className}>{children}</ul>;
}

export function MotionItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <li className={className}>{children}</li>;
}
