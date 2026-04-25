import { PostCover } from "@/components/covers/PostCover";

type Props = {
  slug: string;
  /**
   * @deprecated Hand-crafted raster overrides are no longer rendered here —
   * every post resolves through `<PostCover>` which dispatches to a bespoke
   * React SVG component. The field remains in the manifest schema as an
   * emergency static-image override path; it is not wired here. See
   * `docs/interactive-components.md` §6 for the cover system.
   */
  coverImage?: string;
  alt?: string;
};

/**
 * HeroTile — sits at the top of each post page. Its `view-transition-name`
 * (now owned by `<PostCover>`'s `CoverFrame` wrapper, keyed by slug) pairs
 * with the matching PostList cover so the thumbnail morphs into place on
 * navigation (shared-element route transition). On supported browsers the
 * morph is automatic; on Firefox it falls through to instant navigation
 * and the tile renders in its final position.
 *
 * Sizing: 64×64 up to lg, 80×80 from lg, matching the PostList cover
 * dimensions so the source and destination rectangles line up.
 */
export function HeroTile({ slug, alt }: Props) {
  return <PostCover slug={slug} size="hero" ariaLabel={alt || undefined} />;
}
