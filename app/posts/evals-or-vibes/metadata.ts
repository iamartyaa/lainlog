import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "evals-or-vibes";
const VISIBLE_HEADING =
  "Evals, or Vibes? — How to know if your LLM feature is actually any good";
const LYRICAL_TAGLINE = "You can't taste your own wine.";
const HOOK =
  "Two teams, same product, six months. One ships on vibes, one opens a CSV. Why eval suites are the blind tasting protocol your LLM feature needs — and why a 100% pass rate is a failing grade.";

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
