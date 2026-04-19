import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "how-gmail-knows-your-email-is-taken";
const TITLE = "How Gmail knows your email is taken, instantly";
const HOOK = "the pipeline that tells you 'already taken' before your finger lifts.";

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
