"use client";

import { StarBorder } from "@/components/fancy/star-border/StarBorder";
import { Glitter } from "@/components/fancy/Glitter";

/**
 * NewestChip — a small "New" sticker that sits on top of the most recent
 * post tile in <PostList>.
 *
 * Composition:
 *   - Outer: a <StarBorder> rendered as a non-interactive `<span>` (the
 *     parent <a> already owns the click target — we don't want a nested
 *     interactive element). The orbiting radial gradient uses the site
 *     accent (`var(--color-accent)`).
 *   - Inner: the chip text + a 3-dot <Glitter> cluster sized down for the
 *     chip's smaller bounds (4 px dots vs the Note's 5 px).
 *
 * Visual restraint:
 *   - StarBorder + Glitter is a deliberate double-up. The orbit traces the
 *     perimeter; the glitter sparkles the corners. They complement instead
 *     of competing because the orbit is continuous (never punctuated) and
 *     the glitter is asynchronous (each dot off-beat from the orbit).
 *   - Glitter dots are dialed down to 3 (vs Note's 4) and made smaller so
 *     the chip doesn't read as "loudest thing on the page."
 *
 * Reduced-motion:
 *   - StarBorder freezes its orbit (handled in StarBorder.css).
 *   - Glitter returns null entirely (handled in Glitter.tsx).
 *   - The chip stays visible as static text with a soft glow ring.
 *
 * Placement:
 *   - The chip is positioned absolutely top-right of the post-tile cover
 *     thumbnail; that positioning is the responsibility of the call site
 *     (see PostList.tsx). The chip itself does not assume a position.
 */
export function NewestChip() {
  return (
    <>
      <style>{`
        /* Chip-specific tightening of the StarBorder inner content.
           StarBorder's default padding (8px / 14px) is sized for a button;
           the chip wants a denser 3px / 8px box and an accent-tinted halo
           so the "New" reads as a sticker, not a control. The 999px radius
           mirrors the chip's pill silhouette over StarBorder's default 20px
           rounded-rect — the chip is small enough that 20px reads square. */
        .bs-newest-chip-inner {
          padding: 3px 8px !important;
          border-radius: 999px !important;
          background: color-mix(in oklab, var(--color-accent) 10%, var(--color-surface)) !important;
          border-color: color-mix(in oklab, var(--color-accent) 40%, var(--color-rule)) !important;
        }
      `}</style>
      <StarBorder
      as="span"
      color="var(--color-accent)"
      speed="6s"
      // Override the default 8px/14px padding for a denser chip.
      innerClassName="bs-newest-chip-inner"
      // The chip is decorative — the surrounding <a> announces the post.
      // Mark it aria-hidden so screen readers don't announce "New" twice.
      aria-hidden="true"
    >
      <span
        style={{
          position: "relative",
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-accent)",
        }}
      >
        New
        {/* 3-dot glitter cluster — smaller dots, tight perimeter. */}
        <Glitter
          dots={[
            { x: "-6px", y: "-6px", delay: 0 },
            { x: "calc(100% - 0px)", y: "-4px", delay: 1.2 },
            { x: "50%", y: "calc(100% - 0px)", delay: 2.4 },
          ]}
          size={3}
        />
      </span>
    </StarBorder>
    </>
  );
}

export default NewestChip;
