"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  /** Optional scroll-snap on the x-axis. Each direct child becomes a snap target. */
  scrollSnap?: boolean;
  /** Accessible label for the scroll region. */
  ariaLabel?: string;
};

/**
 * HScroll — horizontal-scroll container with a right-edge fade mask that
 * hides once the reader has scrolled to the end. Used for widgets whose
 * teaching *is* the cross-row pattern (e.g. OriginMatrix) — swapping them
 * into stacked cards would serialize a comparison whose whole point is
 * parallel reading.
 *
 * Touch behavior: pan-x, overscroll contained, so a horizontal swipe on a
 * widget doesn't accidentally dismiss a parent sheet or rubber-band the page.
 */
export function HScroll({ children, scrollSnap = false, ariaLabel }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => {
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow <= 1) {
        setAtEnd(true);
        return;
      }
      setAtEnd(el.scrollLeft >= overflow - 1);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        role={ariaLabel ? "region" : undefined}
        aria-label={ariaLabel}
        tabIndex={0}
        className="overflow-x-auto overscroll-x-contain"
        style={{
          touchAction: "pan-x",
          scrollSnapType: scrollSnap ? "x mandatory" : undefined,
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[var(--spacing-xl)] transition-opacity duration-[200ms]"
        style={{
          opacity: atEnd ? 0 : 1,
          background:
            "linear-gradient(to right, color-mix(in oklab, var(--color-bg) 0%, transparent), var(--color-bg))",
        }}
      />
    </div>
  );
}
