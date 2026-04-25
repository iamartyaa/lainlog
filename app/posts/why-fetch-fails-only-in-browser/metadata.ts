import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "why-fetch-fails-only-in-browser";
const SEO_TITLE = "Why fetch fails in browser but works in curl (CORS) — bytesize";
const HOOK =
  "Why `fetch` returns `TypeError: Failed to fetch` in the browser but works in curl: the same-origin policy, CORS preflights, and what the browser hides from your JS.";

export const subtitle =
  "How CORS actually works — the same-origin policy, preflight requests, and why your `fetch` 200s in DevTools but throws `TypeError: Failed to fetch`.";

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
