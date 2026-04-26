import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "how-javascript-reads-its-own-future";
const VISIBLE_HEADING =
  "JavaScript Hoisting, the TDZ, and the Call Stack Explained";
const LYRICAL_TAGLINE = "How JavaScript reads its own future";
const HOOK =
  "How JavaScript hoisting works, why let and const enter a temporal dead zone, and how execution contexts stack — with playable widgets that show each step.";

/** Visible subtitle on the post page (poetic tagline under the descriptive H1). */
export const subtitle = LYRICAL_TAGLINE;

export const metadata: Metadata = {
  title: `${VISIBLE_HEADING} — lainlog`,
  description: HOOK,
  keywords: [
    "javascript hoisting",
    "temporal dead zone",
    "tdz",
    "call stack",
    "execution context",
    "variable environment",
    "let const var",
    "javascript engine",
  ],
  alternates: {
    canonical: `${SITE}/posts/${SLUG}`,
  },
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
