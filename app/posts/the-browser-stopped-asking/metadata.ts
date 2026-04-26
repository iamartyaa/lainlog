import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-browser-stopped-asking";
const VISIBLE_HEADING = "WebSockets, SSE, and long-polling: how real-time web works";
const LYRICAL_TAGLINE = "The browser stopped asking";
const HOOK =
  "How real-time web apps work: the path from HTTP request-response to long-polling, Server-Sent Events, and WebSockets — what each one keeps alive and why.";

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
