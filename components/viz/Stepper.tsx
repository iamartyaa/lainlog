"use client";

import { WidgetNav } from "./WidgetNav";

type Props = {
  /** 0-indexed current step. */
  value: number;
  /** Total steps (0..total-1 are valid). */
  total: number;
  onChange: (next: number) => void;
  /** Enable auto-play. Defaults true. */
  playable?: boolean;
  /** Milliseconds per auto-play step. */
  playInterval?: number;
};

/**
 * @deprecated Use `<WidgetNav>` directly. `Stepper` is preserved as a thin
 * shim that forwards to `WidgetNav` so external imports do not break in this
 * release. It will be removed in a follow-up PR after every internal callsite
 * has migrated to `WidgetNav`.
 */
export function Stepper(props: Props) {
  return <WidgetNav {...props} />;
}
