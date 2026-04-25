import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-function-that-remembered";
const SEO_TITLE = "JavaScript closures, var vs let, and the loop bug — bytesize";
const HOOK =
  "Why a `for (var i…)` loop with `setTimeout` prints `5 5 5 5 5`: how JavaScript closures capture variables, what `let` actually fixes, and where half your JS bugs start.";

export const subtitle =
  "How JavaScript closures capture variables, why `var` vs `let` in a loop prints `5 5 5 5 5`, and what the heap is really holding.";

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
