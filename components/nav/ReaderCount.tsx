"use client";

import { DigitMatrix } from "./DigitMatrix";

type Props = { count: number | null };

export function ReaderCount({ count }: Props) {
  if (count === null || count === 0) return null;

  const noun = count === 1 ? "reader" : "readers";
  const formatted = new Intl.NumberFormat("en-US").format(count);

  return (
    <span className="inline-flex items-center gap-[var(--spacing-2xs)]">
      <span>Read by</span>
      <DigitMatrix value={count} ariaLabel={formatted} />
      <span>{noun}</span>
    </span>
  );
}
