import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-function-that-remembered";
const VISIBLE_HEADING = "JavaScript closures, var vs let, and the loop bug";
const LYRICAL_TAGLINE = "The function that remembered";
const HOOK =
  "Why a `for (var i…)` loop with `setTimeout` prints `5 5 5 5 5`: how JavaScript closures capture variables, what `let` actually fixes, and where half your JS bugs start.";

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
