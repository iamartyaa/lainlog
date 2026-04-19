import type { ReactNode } from "react";

/**
 * Em — pedagogical emphasis. Italic Plex Serif + weight 500 so emphasised
 * words actually lift off the body copy (weight 400) and read as a visual
 * anchor. Weight 500 is already in the loaded font subset (Path B-lite,
 * shipped #17) so this change costs zero payload.
 *
 * Density is policed by the `em-abuse` rule in scripts/audit-prose.mjs
 * (warns on ≥ 2 consecutive `<Em>` in one paragraph).
 */
export function Em({ children }: { children: ReactNode }) {
  return <em className="italic font-medium">{children}</em>;
}
