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
      {/* Heading row — on mobile (< lg) the wordmark and the WanderingEyes
          ornament share this row via flex justify-between, so the eyes sit
          beside the heading rather than below the subtitle. On lg+ the row
          collapses back to a block (eyes hidden here, rendered in their
          desktop slot below). */}
      <div className="flex items-center justify-between gap-[var(--spacing-md)] lg:block">
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

        {/* Mobile-only inline WanderingEyes — sits to the right of the
            heading. Sized just below the heading's visual block (heading
            font is clamp(3rem, …, 4.5rem); cap-height ~70%, so h-9 ≈ 36 px
            sits a touch smaller than the ~38 px mobile letter block). */}
        <div className="block lg:hidden shrink-0">
          <WanderingEyes
            aria-label=""
            aria-hidden
            role="presentation"
            className="h-9 w-[81px] [--eye-color:#ffffff] [--pupil-color:#000000] [--eye-outline-color:#000000] [--eye-outline-width:1px]"
            style={{
              "--duration": "8s",
            } as React.CSSProperties}
          />
        </div>
      </div>

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

      {/* Desktop-only WanderingEyes slot — centered both axes between the
          subtitle paragraph and the meta row. flex-1 grows to fill the
          remaining vertical space; items-center + justify-center balance
          the eyes inside that space (equal gap above + below, horizontal
          mid). Sized h-14 / 126×56 px per 9:4. White eye disc with a 1 px
          black outline (so it reads on the near-white light theme) and a
          solid black pupil. 8s cadence sits in the editorial-calm register
          from svg-cover-playbook §14. */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <WanderingEyes
          aria-label=""
          aria-hidden
          role="presentation"
          className="h-14 w-[126px] [--eye-color:#ffffff] [--pupil-color:#000000] [--eye-outline-color:#000000] [--eye-outline-width:1px]"
          style={{
            // CSS custom property consumed by the upstream component to
            // pace both keyframe loops (move + blink).
            "--duration": "8s",
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
