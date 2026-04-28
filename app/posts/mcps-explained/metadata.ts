import type { Metadata } from "next";
import { SITE_URL as SITE } from "@/lib/site";

const SLUG = "mcps-explained";
const VISIBLE_HEADING = "MCPs Explained: What They Are and How They Work";
const HOOK =
  "Model Context Protocol, end-to-end. The handshake that opens every session, the six primitives that ride it, the two transports that carry it, and why every published MCP attack is a host-side failure — not a protocol flaw.";

export const metadata: Metadata = {
  title: `${VISIBLE_HEADING} — lainlog`,
  description: HOOK,
  keywords: [
    "MCP",
    "model context protocol",
    "MCP server",
    "MCP client",
    "MCP host",
    "JSON-RPC",
    "tool calling",
    "sampling",
    "elicitation",
    "roots",
    "Streamable HTTP",
    "Anthropic",
    "AI agents",
    "lethal trifecta",
    "tool poisoning",
  ],
  alternates: {
    canonical: `${SITE}/posts/${SLUG}`,
  },
  openGraph: {
    title: `${VISIBLE_HEADING} — lainlog`,
    description: HOOK,
    url: `${SITE}/posts/${SLUG}`,
    type: "article",
    publishedTime: "2026-04-28T00:00:00.000Z",
    images: [{ url: `${SITE}/og/${SLUG}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${VISIBLE_HEADING} — lainlog`,
    description: HOOK,
    images: [`${SITE}/og/${SLUG}`],
  },
};
