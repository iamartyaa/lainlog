import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-line-that-waits-its-turn";
const VISIBLE_HEADING =
  "How the JavaScript event loop, microtasks, and the call stack work";
const LYRICAL_TAGLINE = "The line that waits its turn";
const HOOK =
  "Why setTimeout(0) is never zero, why await feels seamless, and why one runaway Promise can stall a tab — one rule about the microtask queue explains all three.";

/** Visible subtitle on the post page (poetic tagline under the descriptive H1). */
export const subtitle = LYRICAL_TAGLINE;

export const metadata: Metadata = {
  title: `${VISIBLE_HEADING} — bytesize`,
  description: HOOK,
  openGraph: {
    title: `${VISIBLE_HEADING} — bytesize`,
    description: HOOK,
    url: `${SITE}/posts/${SLUG}`,
    type: "article",
    images: [{ url: `${SITE}/og/${SLUG}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${VISIBLE_HEADING} — bytesize`,
    description: HOOK,
    images: [`${SITE}/og/${SLUG}`],
  },
};
