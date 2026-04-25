import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-browser-stopped-asking";
const SEO_TITLE = "WebSockets, SSE, long-polling: real-time web — bytesize";
const HOOK =
  "How real-time web apps work: the path from HTTP request-response to long-polling, Server-Sent Events, and WebSockets — what each one keeps alive and why.";

export const subtitle =
  "How real-time web apps escape HTTP's request-response shape — long-polling, Server-Sent Events, and WebSockets, side by side.";

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
