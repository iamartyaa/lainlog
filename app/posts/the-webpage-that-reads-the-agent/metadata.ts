import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-webpage-that-reads-the-agent";
const TITLE = "The webpage that reads the agent";
const HOOK =
  "you don't break the model — you break the page it reads. six ways the open web learned to trap an AI agent, mapped to the stages of cognition they corrupt.";

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
