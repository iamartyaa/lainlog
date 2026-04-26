"use client";

import type { ChangeEvent } from "react";
import { playSound } from "@/lib/audio";

type Props = {
  label?: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  /** Optional formatter for the readout (e.g. (v) => `k = ${v}`). */
  format?: (value: number) => string;
};

/**
 * Scrubber — styled native <input type="range">. Thumb is a 14px terracotta
 * square (echoing the <Block> shape); track is a 2px rule.
 */
export function Scrubber({ label, value, min = 0, max, step = 1, onChange, format }: Props) {
  const pct = ((value - min) / Math.max(max - min, 1)) * 100;
  const readout = format ? format(value) : String(value);

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.currentTarget.value);
    if (!Number.isNaN(v)) onChange(v);
  };

  return (
    <label className="flex items-center gap-[var(--spacing-sm)] font-sans" style={{ fontSize: "var(--text-ui)" }}>
      {label ? (
        <span className="min-w-[3ch] font-mono" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </span>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handle}
        // One Progress-Tick on drag-start. Continuous "while dragging" sounds would
        // be irritating and stack into a wall — the throttle would clamp
        // them anyway, but we keep it explicit. Keyboard arrow nudges fire
        // through `onChange`'s native repeat, but the audio throttle
        // (100 ms) drops the duplicates.
        onPointerDown={() => playSound("Progress-Tick")}
        onKeyDown={(e) => {
          // Arrow keys / Home / End / PageUp / PageDown all change a slider.
          // Cue the first keystroke; throttle handles the held-down case.
          if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowDown" ||
            e.key === "Home" ||
            e.key === "End" ||
            e.key === "PageUp" ||
            e.key === "PageDown"
          ) {
            playSound("Progress-Tick");
          }
        }}
        className="bs-range flex-1"
        style={{
          ["--pct" as string]: `${pct}%`,
        }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <span
        className="font-mono tabular-nums min-w-[3ch] text-right"
        style={{ fontSize: "var(--text-small)", color: "var(--color-text)" }}
      >
        {readout}
      </span>
    </label>
  );
}
