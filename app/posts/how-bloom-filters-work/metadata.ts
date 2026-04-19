import type { Metadata } from "next";

const SITE = "https://bytesize.vercel.app";
const SLUG = "how-bloom-filters-work";
const TITLE = "How Bloom Filters Work";
const HOOK = "a probabilistic set, in three hash lanes.";

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
