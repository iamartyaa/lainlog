import { ReaderCount } from "@/components/nav/ReaderCount";
import { WanderingEyes } from "@/components/loading-ui/wandering-eyes";
import { SITE_ABOUT, SITE_NAME } from "@/lib/site";

const COPYRIGHT_START = 2026;
const COPYRIGHT_NOW = new Date().getFullYear();

/**
 * AboutColumn — the left pane of the home page. Big serif wordmark carries
 * the brand; an about paragraph sets the tone; a small WanderingEyes ornament
 * adds a single delight beat between copy blocks; the bottom row holds the
 * meta (reader count + copyright). Sticky on md+ so it stays visible while
 * the post list scrolls.
 *
 * No entrance animation — the column renders to its final state on mount.
 * Hover affordances on the rest of the page (post rows, header link) are
 * untouched; this file just stops choreographing the wordmark/paragraph/meta
 * fade-in. The WanderingEyes ornament owns its own ambient cadence (paused
 * under prefers-reduced-motion).
 */
type AboutColumnProps = {
  readerCount: number | null;
};

export function AboutColumn({ readerCount }: AboutColumnProps) {
  const years =
    COPYRIGHT_NOW === COPYRIGHT_START
      ? `${COPYRIGHT_START}`
      : `${COPYRIGHT_START} – ${COPYRIGHT_NOW}`;

  return (
    <aside className="md:sticky md:top-[var(--spacing-lg)] self-start flex flex-col min-h-0 md:min-h-[480px]">
      {/* Giant serif wordmark — brand moment. */}
      <h1
        className="font-serif font-semibold"
        style={{
          fontSize: "clamp(3rem, 2.2rem + 3vw, 4.5rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          color: "var(--color-text)",
        }}
      >
        {SITE_NAME}
      </h1>

      {/* Tagline + about. */}
      <p
        className="mt-[var(--spacing-lg)] font-serif"
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          color: "var(--color-text-muted)",
          maxWidth: "26ch",
        }}
      >
        {SITE_ABOUT}
      </p>

      {/* Single delight beat: WanderingEyes between subtitle and meta row.
          Sized small (h-9 mobile / h-12 lg+) per the 9:4 aspect ratio so
          it stays an ornament rather than a hero. The eye disc inherits
          --color-text-muted, the pupil takes --color-accent (terracotta) —
          matches the brand without raising volume. 4.5s cadence sits in
          the editorial-calm register from svg-cover-playbook §14. */}
      <div className="mt-[var(--spacing-lg)] flex items-center">
        <WanderingEyes
          aria-label=""
          aria-hidden
          role="presentation"
          className="h-9 w-[81px] lg:h-12 lg:w-[108px] [--eye-color:var(--color-text-muted)] [--pupil-color:var(--color-accent)]"
          style={{
            // CSS custom property consumed by the upstream component to
            // pace both keyframe loops (move + blink).
            "--duration": "4.5s",
          } as React.CSSProperties}
        />
      </div>

      {/* Bottom-left meta row — reader count + copyright */}
      <div
        className="mt-auto pt-[var(--spacing-2xl)] flex items-center gap-[var(--spacing-lg)] font-mono"
        style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}
      >
        <ReaderCount count={readerCount} />
        <span className="tabular-nums" aria-label={`copyright ${years}`}>
          © {years}
        </span>
      </div>
    </aside>
  );
}
