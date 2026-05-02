/**
 * Site-wide feature flags.
 *
 * Toggleable visibility constants that gate user-facing surfaces without
 * deleting underlying routes or content. Flipping a flag here is the
 * single source of truth — every consumer reads from this module so a
 * grep for the flag name lands every call site.
 *
 * Why a typed constant and not env vars:
 *   - These flags affect static output (sitemap, home rendering); resolving
 *     them at build time keeps the bundle deterministic.
 *   - The compiler tree-shakes unreachable branches when the flag is a
 *     literal `false`, so gating a feature OFF removes its code entirely
 *     from the client bundle.
 */

/**
 * When `false`, courses are hidden from listings, the home pinned card,
 * and the sitemap. The course routes themselves (`/courses/<slug>` and
 * `/courses/<slug>/<chapter>`) remain accessible — flipping this flag is
 * a visibility toggle, not a takedown. Useful for previewing course work
 * before announcing it.
 *
 * To re-enable: set this to `true` and rebuild. No other code changes.
 */
export const COURSES_VISIBLE = false;
