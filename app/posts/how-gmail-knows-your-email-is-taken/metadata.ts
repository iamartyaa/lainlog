import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "how-gmail-knows-your-email-is-taken";
const SEO_TITLE = "How instant email-availability checks work — bytesize";
const HOOK =
  "How Gmail tells you an email is taken before you finish typing: debouncing, normalisation, caches, Bloom filters, and race-safe writes — explained with playable widgets.";

export const subtitle =
  "The six-stage pipeline behind instant username availability checks — debounce, normalisation, cache, Bloom filter, race-safe writes.";

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: HOOK,
  openGraph: {
    title: SEO_TITLE,
    description: HOOK,
    url: `${SITE}/posts/${SLUG}`,
    type: "article",
    images: [{ url: `${SITE}/og/${SLUG}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: HOOK,
    images: [`${SITE}/og/${SLUG}`],
  },
};
