import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "how-gmail-knows-your-email-is-taken";
const VISIBLE_HEADING = "How instant email-availability checks work";
const LYRICAL_TAGLINE = "How Gmail knows your email is taken, instantly";
const HOOK =
  "How Gmail tells you an email is taken before you finish typing: debouncing, normalisation, caches, Bloom filters, and race-safe writes — explained with playable widgets.";

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
