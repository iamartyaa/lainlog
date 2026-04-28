import type { JSX } from "react";
import { HowGmailCoverStatic } from "./HowGmailCover";
import { WhyFetchFailsCoverStatic } from "./WhyFetchFailsCover";
import { BrowserStoppedAskingCoverStatic } from "./BrowserStoppedAskingCover";
import { FunctionRememberedCoverStatic } from "./FunctionRememberedCover";
import { WebpageReadsAgentCoverStatic } from "./WebpageReadsAgentCover";
import { LineThatWaitsItsTurnCoverStatic } from "./LineThatWaitsItsTurnCover";
import { HowJavascriptReadsItsOwnFutureCoverStatic } from "./HowJavascriptReadsItsOwnFutureCover";
import { McpsExplainedCoverStatic } from "./McpsExplainedCover";

/**
 * Server-safe registry of pure-JSX static cover components, keyed by post slug.
 *
 * Why this exists: Satori (`next/og`) renders pure JSX → PNG and does not
 * execute React hooks or `motion/react`. Each animated cover therefore has a
 * sibling `<Name>CoverStatic` export that matches the cover's reduced-motion
 * end-state (per `docs/svg-cover-playbook.md §8`). The OG route looks up by
 * slug and composes the static cover into the share-preview tile.
 *
 * Hex palette used inside every static export (Satori has limited
 * CSS-variable support, so tokens are inlined as hex):
 *
 *   BG       = "#0e1114"  (the OG canvas background)
 *   SURFACE  = "#1a1714"
 *   RULE     = "#2a2622"
 *   TEXT     = "#f8f5f0"
 *   MUTED    = "#7a7570"
 *   ACCENT   = "#d97341"  (terracotta — the load-bearing accent)
 *
 * Where the animated cover used `color-mix()` (also unsupported by Satori),
 * the static export approximates with a hex value composited over BG.
 *
 * Keep this file `"use client"`-free — it must be importable from edge
 * runtime contexts (the `/og/[slug]` route).
 */
export const STATIC_COVERS: Record<string, () => JSX.Element> = {
  "how-gmail-knows-your-email-is-taken": HowGmailCoverStatic,
  "why-fetch-fails-only-in-browser": WhyFetchFailsCoverStatic,
  "the-browser-stopped-asking": BrowserStoppedAskingCoverStatic,
  "the-function-that-remembered": FunctionRememberedCoverStatic,
  "the-webpage-that-reads-the-agent": WebpageReadsAgentCoverStatic,
  "the-line-that-waits-its-turn": LineThatWaitsItsTurnCoverStatic,
  "how-javascript-reads-its-own-future": HowJavascriptReadsItsOwnFutureCoverStatic,
  "mcps-explained": McpsExplainedCoverStatic,
};
