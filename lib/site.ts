/**
 * Centralised site-wide constants. Every user-facing string about bytesize
 * itself — name, URL, description, tagline — lives here. When a value
 * changes, change it in exactly one place.
 */

export const SITE_URL = "https://www.byte-size.xyz";

export const SITE_NAME = "bytesize";

/** Meta description, RSS channel description, OG default subtitle. */
export const SITE_DESCRIPTION =
  "long-form essays on software and AI, each built around interactive widgets that show how the thing actually works.";

/** Short line shown on the home page and (abridged) in OG default hook. */
export const SITE_TAGLINE = "engineering essays with widgets you can take apart.";

/** Longer blurb for the home's about column — Phase 3. */
export const SITE_ABOUT =
  "one question per post. ten minutes of prose, twenty of widgets you can poke at. for engineers who want the details beneath the abstractions.";

/** GoatCounter subdomain for the analytics account backing the reader counter. */
export const GOATCOUNTER_CODE = "bytesize";
