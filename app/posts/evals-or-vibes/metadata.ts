import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "evals-or-vibes";
const VISIBLE_HEADING =
  "How to know if your AI is actually any good — a primer on evals for LLM products";
const LYRICAL_TAGLINE = "A primer on evals for LLM products";
const HOOK =
  "An eval is a test for an LLM feature: a list of inputs, the answers you expect, and a way to score what came back. Most teams skip it. Here's the working mental model — three kinds of evals, and a Monday-morning recipe you can run with a spreadsheet.";

/** Visible subtitle on the post page (mono eyebrow under the descriptive H1). */
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
