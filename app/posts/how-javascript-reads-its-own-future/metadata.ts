import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "how-javascript-reads-its-own-future";
const VISIBLE_HEADING = "How JavaScript reads its own future";
const LYRICAL_TAGLINE =
  "Hoisting, the TDZ, and the call stack — one mechanism, not three quirks";
const HOOK =
  "Before line 1 runs, the JavaScript engine has already walked your file. Hoisting, the TDZ, and the call stack are one mechanism — explored with playable widgets.";

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
