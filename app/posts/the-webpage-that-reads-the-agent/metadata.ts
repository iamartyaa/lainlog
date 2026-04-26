import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-webpage-that-reads-the-agent";
const VISIBLE_HEADING = "AI agent traps & prompt injection on the open web";
const LYRICAL_TAGLINE = "The webpage that reads the agent";
const HOOK =
  "How attackers hijack AI agents through the pages they read: six classes of agent traps — content injection, memory poisoning, jailbreaks — mapped to cognition stages.";

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
