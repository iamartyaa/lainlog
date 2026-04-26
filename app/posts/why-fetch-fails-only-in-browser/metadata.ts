import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "why-fetch-fails-only-in-browser";
const VISIBLE_HEADING = "Why fetch fails in browser but works in curl (CORS)";
const LYRICAL_TAGLINE = "The server already said yes. The browser threw the answer away.";
const HOOK =
  "Why `fetch` returns `TypeError: Failed to fetch` in the browser but works in curl: the same-origin policy, CORS preflights, and what the browser hides from your JS.";

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
