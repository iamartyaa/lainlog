"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useCourseProgress — local-only chapter-progress tracker.
 *
 * Storage
 *   key:    `bytesize:course:<courseSlug>:progress`
 *   value:  JSON array of chapter slugs the reader has visited.
 *
 * Progress semantic (banked feedback v1 #1)
 *   "Visited" is binary — set on first mount of a chapter page (Q4=a). The
 *   landing-page progress dots show *which* chapters have been seen, not
 *   completion percentage. The chapter-page top progress rule shows the
 *   share of *chapters visited* so far, not chapter index — see
 *   <ChapterTopRule>'s comment.
 *
 * SSR safety (banked feedback v2-independent #2a)
 *   localStorage is read inside useEffect only. The first render — server
 *   AND first client render — returns `{ visited: empty Set, isHydrated:
 *   false }`. After hydration, the real state takes over and React
 *   re-renders. Components must render their unvisited state until
 *   `isHydrated` is true to avoid hydration mismatches.
 */

export type CourseProgress = {
  visited: Set<string>;
  isHydrated: boolean;
  markVisited: (chapterSlug: string) => void;
};

const PREFIX = "bytesize:course:";
const SUFFIX = ":progress";

function storageKey(courseSlug: string): string {
  return `${PREFIX}${courseSlug}${SUFFIX}`;
}

function readFromStorage(courseSlug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(courseSlug));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function writeToStorage(courseSlug: string, visited: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(courseSlug),
      JSON.stringify([...visited]),
    );
  } catch {
    // Quota / private browsing — silently no-op. Progress is local-only.
  }
}

export function useCourseProgress(courseSlug: string): CourseProgress {
  // First render (SSR + first client render): empty set, not hydrated.
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setVisited(readFromStorage(courseSlug));
    setIsHydrated(true);
  }, [courseSlug]);

  const markVisited = useCallback(
    (chapterSlug: string) => {
      setVisited((prev) => {
        if (prev.has(chapterSlug)) return prev;
        const next = new Set(prev);
        next.add(chapterSlug);
        writeToStorage(courseSlug, next);
        return next;
      });
    },
    [courseSlug],
  );

  return { visited, isHydrated, markVisited };
}
