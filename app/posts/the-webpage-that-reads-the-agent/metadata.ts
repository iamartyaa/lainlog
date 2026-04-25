import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "the-webpage-that-reads-the-agent";
const SEO_TITLE = "AI agent traps & prompt injection on the web — bytesize";
const HOOK =
  "How attackers hijack AI agents through the pages they read: six classes of agent traps — content injection, memory poisoning, jailbreaks — mapped to cognition stages.";

export const subtitle =
  "Six classes of prompt-injection and agent-trap attacks on the open web, mapped to the stages of cognition they corrupt.";

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
