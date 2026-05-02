"use client";

import { CoverFrame } from "./_CoverFrame";
import { HowGmailCover } from "./HowGmailCover";
import { WhyFetchFailsCover } from "./WhyFetchFailsCover";
import { BrowserStoppedAskingCover } from "./BrowserStoppedAskingCover";
import { FunctionRememberedCover } from "./FunctionRememberedCover";
import { WebpageReadsAgentCover } from "./WebpageReadsAgentCover";
import { LineThatWaitsItsTurnCover } from "./LineThatWaitsItsTurnCover";
import { HowJavascriptReadsItsOwnFutureCover } from "./HowJavascriptReadsItsOwnFutureCover";
import { EvalsOrVibesCover } from "./EvalsOrVibesCover";

/**
 * Slug → cover-component registry.
 *
 * Every post gets a hand-built React SVG component. New posts: add a file in
 * components/covers/, import it here, register the slug. Unknown slugs fall
 * through to <DefaultCover /> so the page never breaks at the cover boundary.
 */
const REGISTRY: Record<string, () => React.ReactNode> = {
  "how-gmail-knows-your-email-is-taken": HowGmailCover,
  "why-fetch-fails-only-in-browser": WhyFetchFailsCover,
  "the-browser-stopped-asking": BrowserStoppedAskingCover,
  "the-function-that-remembered": FunctionRememberedCover,
  "the-webpage-that-reads-the-agent": WebpageReadsAgentCover,
  "the-line-that-waits-its-turn": LineThatWaitsItsTurnCover,
  "how-javascript-reads-its-own-future": HowJavascriptReadsItsOwnFutureCover,
  "evals-or-vibes": EvalsOrVibesCover,
};

type Size = "thumb" | "hero";

type Props = {
  slug: string;
  size: Size;
  /** Accessible label. Omit for decorative usage; the cover becomes aria-hidden. */
  ariaLabel?: string;
};

/**
 * PostCover — the only cover entry point in app code.
 *
 * Picks the per-post SVG component from the registry, mounts it inside a
 * shared <CoverFrame> that handles size, view-transition pairing, and the
 * inView gate. Callers never reach for individual cover files.
 */
export function PostCover({ slug, size, ariaLabel }: Props) {
  const Cover = REGISTRY[slug] ?? DefaultCover;
  return (
    <CoverFrame slug={slug} size={size} ariaLabel={ariaLabel}>
      <Cover />
    </CoverFrame>
  );
}

/**
 * DefaultCover — fallback for slugs not in the registry. A single muted
 * terracotta dot, mirroring the hydration-canvas idiom in DESIGN.md §7.
 * Reaching this in production means a post shipped without a cover; treat
 * it as a bug, not a feature.
 */
function DefaultCover() {
  return (
    <g>
      <circle cx="50" cy="50" r="3" fill="var(--color-accent)" />
    </g>
  );
}
