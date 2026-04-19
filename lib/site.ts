/**
 * Centralised site-wide constants. Every user-facing string about bytesize
 * itself — name, URL, description, tagline — lives here. When a value
 * changes, change it in exactly one place.
 */

export const SITE_URL = "https://bytesize.vercel.app";

export const SITE_NAME = "bytesize";

export const SITE_AUTHOR = "Amartya";

export const SITE_AUTHOR_URL = "https://github.com/iamartyaa";

/** Meta description, RSS channel description, OG default subtitle. */
export const SITE_DESCRIPTION =
  "long-form essays on software and AI, each built around interactive widgets that show how the thing actually works.";

/** Short line shown on the home page and (abridged) in OG default hook. */
export const SITE_TAGLINE = "engineering essays with widgets you can take apart.";

/** Longer blurb for the home's about column — Phase 3. */
export const SITE_ABOUT =
  "one question per post. ten minutes of prose, twenty of widgets you can poke at. for engineers who want the details beneath the abstractions.";
