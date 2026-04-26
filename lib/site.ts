/**
 * Centralised site-wide constants. Every user-facing string about lainlog
 * itself — name, URL, description, tagline — lives here. When a value
 * changes, change it in exactly one place.
 */

// Operational note: byte-size.xyz should 301-redirect to lainlog.com once
// the new domain is live (Vercel project domain config + redirect rule).
export const SITE_URL = "https://lainlog.com";

export const SITE_NAME = "lainlog";

/** Meta description, RSS channel description, OG default subtitle. */
export const SITE_DESCRIPTION =
  "Long-form engineering essays paired with interactive widgets — what's actually happening when you press Run, with the wires showing.";

/** Short line shown on the home page and (abridged) in OG default hook. */
export const SITE_TAGLINE = "notes from the wired.";

/** Longer blurb for the home's about column — Phase 3. */
export const SITE_ABOUT =
  "Engineering writing for people who'd rather pry the abstraction open than read about it. One question per post. Ten minutes of prose, twenty of widgets you can poke at.";

/** GoatCounter subdomain for the analytics account backing the reader counter. */
export const GOATCOUNTER_CODE = "lainlog";
