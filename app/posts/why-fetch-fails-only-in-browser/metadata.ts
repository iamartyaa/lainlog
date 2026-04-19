import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "why-fetch-fails-only-in-browser";
const TITLE = "Why `fetch` works in curl but the browser blocks it";
const HOOK =
  "the server did answer — your browser is just holding the response back from your JavaScript.";

export const metadata: Metadata = {
  title: TITLE,
  description: HOOK,
  openGraph: {
    title: TITLE,
    description: HOOK,
    url: `${SITE}/posts/${SLUG}`,
    type: "article",
    images: [{ url: `${SITE}/og/${SLUG}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: HOOK,
    images: [`${SITE}/og/${SLUG}`],
  },
};
