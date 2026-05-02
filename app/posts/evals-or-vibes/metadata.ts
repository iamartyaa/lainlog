import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "evals-or-vibes";
const VISIBLE_HEADING =
  "Evals, or Vibes? — How to know if your LLM feature is actually any good";
const LYRICAL_TAGLINE = "Vibes don't scale.";
const HOOK =
  "You're shipping AI on vibes. Your prompt looks fine in the playground, the demo lands, the suite passes — and you're still the last person in the building qualified to grade the output. Here's what to do about it on Monday morning.";

/** Visible subtitle on the post page (poetic tagline under the descriptive H1). */
export const subtitle = LYRICAL_TAGLINE;

export const metadata: Metadata = {
  title: `${VISIBLE_HEADING} — lainlog`,
  description: HOOK,
  openGraph: {
    title: `${VISIBLE_HEADING} — lainlog`,
    description: HOOK,
    url: `${SITE}/posts/${SLUG}`,
    type: "article",
    images: [{ url: `${SITE}/og/${SLUG}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${VISIBLE_HEADING} — lainlog`,
    description: HOOK,
    images: [`${SITE}/og/${SLUG}`],
  },
};
