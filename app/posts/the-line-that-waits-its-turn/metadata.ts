import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-line-that-waits-its-turn";
const VISIBLE_HEADING =
  "JavaScript Event Loop Explained: Microtasks and the Call Stack";
const LYRICAL_TAGLINE = "The line that waits its turn";
const HOOK =
  "How the JavaScript event loop schedules microtasks before timers, why await feels seamless, and why one runaway Promise can freeze a tab.";

/** Visible subtitle on the post page (poetic tagline under the descriptive H1). */
export const subtitle = LYRICAL_TAGLINE;

export const metadata: Metadata = {
  title: `${VISIBLE_HEADING} — lainlog`,
  description: HOOK,
  keywords: [
    "javascript event loop",
    "microtasks",
    "macrotasks",
    "call stack",
    "setTimeout",
    "promise",
    "async await",
    "node event loop",
    "queueMicrotask",
    "microtask queue",
  ],
  alternates: {
    canonical: `${SITE}/posts/${SLUG}`,
  },
  openGraph: {
    title: `${VISIBLE_HEADING} — lainlog`,
    description: HOOK,
    url: `${SITE}/posts/${SLUG}`,
    type: "article",
    publishedTime: "2026-04-25T00:00:00.000Z",
    images: [{ url: `${SITE}/og/${SLUG}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${VISIBLE_HEADING} — lainlog`,
    description: HOOK,
    images: [`${SITE}/og/${SLUG}`],
  },
};
