import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-browser-stopped-asking";
const TITLE = "The browser stopped asking";
const HOOK =
  "HTTP is request-response by design. Real-time apps break that rule by keeping one request alive forever — and the server starts talking first.";

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
