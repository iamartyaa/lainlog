import Image from "next/image";

type Props = {
  slug: string;
  /** Optional hand-crafted cover path. Falls back to /cover/[slug]. */
  coverImage?: string;
  alt?: string;
};

/**
 * HeroTile — sits at the top of each post page. Its `view-transition-name`
 * pairs with the matching PostList cover so the thumbnail morphs into place
 * on navigation (shared-element route transition). On supported browsers
 * the morph is automatic; on Firefox it falls through to instant navigation
 * and the tile simply renders in its final position.
 *
 * Sizing: 64×64 up to md, 80×80 from lg, matching the PostList cover
 * dimensions so the source and destination rectangles line up.
 */
export function HeroTile({ slug, coverImage, alt = "" }: Props) {
  const src = coverImage ?? `/cover/${slug}`;
  return (
    <div
      className="relative aspect-square h-[64px] w-[64px] lg:h-[80px] lg:w-[80px] overflow-hidden rounded-[var(--radius-sm)]"
      style={{
        background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
        border: "1px solid var(--color-rule)",
        viewTransitionName: `cover-${slug}`,
      }}
      aria-hidden={alt ? undefined : true}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 80px, 64px"
        className="object-cover"
      />
    </div>
  );
}
