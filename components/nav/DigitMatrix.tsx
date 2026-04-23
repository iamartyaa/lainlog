"use client";

import { Matrix, digits, type Frame } from "@/components/unlumen-ui/matrix";

type Props = {
  value: number;
  ariaLabel?: string;
};

const MATRIX_ON = "var(--color-accent)";
const MATRIX_OFF = "color-mix(in oklab, var(--color-text-muted) 18%, transparent)";

export function DigitMatrix({ value, ariaLabel }: Props) {
  const chars = String(Math.max(0, Math.floor(value))).split("");

  return (
    <span
      role="img"
      aria-label={ariaLabel ?? String(value)}
      className="inline-flex items-center gap-[3px] align-[-2px]"
    >
      {chars.map((char, i) => {
        const digit = Number(char);
        const pattern: Frame = digits[digit];
        return (
          <Matrix
            key={i}
            rows={7}
            cols={5}
            pattern={pattern}
            size={3}
            gap={1}
            palette={{ on: MATRIX_ON, off: MATRIX_OFF }}
            brightness={1}
            noGlow
          />
        );
      })}
    </span>
  );
}
