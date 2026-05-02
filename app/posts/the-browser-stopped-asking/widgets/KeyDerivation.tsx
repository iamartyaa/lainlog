"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { TextHighlighter } from "@/components/fancy";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";
import { playSound } from "@/lib/audio";
import { WidgetShell } from "@/components/viz/WidgetShell";
import {
  ComputeBox,
  type Computed,
  makeAccept,
  randomKey,
} from "./_handshake-shared";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

/**
 * KeyDerivation — §4 exploratory widget. Hits the browser's Web Crypto API
 * for real, computes SHA-1 over a fresh random key + RFC 6455 GUID, base64s
 * the digest. The reader's machine produces the bytes; nothing is faked.
 *
 * **Initial-paint contract (B2)**: state is `useState<Computed | null>(null)`.
 * On mount, a single useEffect fires `reroll()`. While `computed === null`,
 * the canvas renders `key = (generating)` and a `computing…` placeholder
 * in the AcceptSettle slot — no spec-sample flash. The placeholder slot
 * keeps the same height as the eventual real value (frame-stable, R6).
 * Once the digest resolves, the first real key + accept land with the
 * AcceptSettle flicker that subsequent rerolls also use. Honest:
 * "the widget is computing this now," not "here's a value, oh wait."
 */
export function KeyDerivation() {
  const [computed, setComputed] = useState<Computed | null>(null);
  const [hashMs, setHashMs] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const mountedRef = useRef(false);
  const tap = useTapPulse<HTMLButtonElement>();

  const reroll = useCallback(async () => {
    setPending(true);
    const key = randomKey();
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const accept = await makeAccept(key);
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    setHashMs(t1 - t0);
    setComputed({ key, accept });
    setPending(false);
  }, []);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    void reroll();
  }, [reroll]);

  const onClick = () => {
    if (pending) return;
    playSound("Progress-Tick");
    tap.pulse();
    void reroll();
  };

  const measurements =
    computed != null && hashMs != null
      ? `SHA-1 in ${hashMs.toFixed(2)} ms`
      : "SHA-1 ready";

  return (
    <WidgetShell
      title="your browser does the SHA-1"
      measurements={measurements}
      captionTone="prominent"
      caption={
        <>
          <TextHighlighter
            triggerType="auto"
            transition={HL_TX}
            highlightColor={HL_COLOR}
            className="rounded-[0.2em] px-[1px]"
          >
            Tap regenerate
          </TextHighlighter>{" "}
          and your machine produces a fresh random key, glues on the GUID,
          and runs the SHA-1. Nothing in the reveal is precomputed.
        </>
      }
      controls={
        <div className="flex items-center justify-center w-full">
          <motion.button
            ref={tap.ref}
            type="button"
            onClick={onClick}
            aria-label="Regenerate key and recompute accept hash"
            aria-busy={pending}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center font-mono transition-colors"
            style={{
              fontSize: "var(--text-small)",
              color: pending ? "var(--color-text-muted)" : "var(--color-text)",
              border: "1px solid var(--color-rule)",
            }}
            {...PRESS}
          >
            {pending ? "hashing…" : "regenerate key"}
          </motion.button>
        </div>
      }
    >
      <KeyDerivationCanvas computed={computed} />
    </WidgetShell>
  );
}

/**
 * Canvas — single panel showing only the server-side compute pane plus
 * AcceptSettle. No browser panel, no pipe, no transcripts, no frame
 * traffic. Authored at 340 mobile / 540 wide. Frame-stable: the
 * placeholder slot carries the same height as the eventual value.
 */
function KeyDerivationCanvas({ computed }: { computed: Computed | null }) {
  const placeholder = computed === null;
  const key96 = computed?.key ?? "";
  const accept = computed?.accept ?? "";
  return (
    <>
      <div className="bs-kd-narrow">
        <PaneCanvas
          authoredWidth={340}
          authoredHeight={140}
          key96={key96}
          accept={accept}
          placeholder={placeholder}
        />
      </div>
      <div className="bs-kd-wide">
        <PaneCanvas
          authoredWidth={540}
          authoredHeight={140}
          key96={key96}
          accept={accept}
          placeholder={placeholder}
        />
      </div>
    </>
  );
}

function PaneCanvas({
  authoredWidth,
  authoredHeight,
  key96,
  accept,
  placeholder,
}: {
  authoredWidth: number;
  authoredHeight: number;
  key96: string;
  accept: string;
  placeholder: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${authoredWidth} ${authoredHeight}`}
      width="100%"
      style={{ maxWidth: authoredWidth, height: "auto", display: "block", margin: "0 auto" }}
      role="img"
      aria-label="Server-side SHA-1 derivation"
    >
      <rect
        x={0}
        y={0}
        width={authoredWidth}
        height={authoredHeight}
        rx={6}
        fill="color-mix(in oklab, var(--color-surface) 55%, transparent)"
        stroke="var(--color-rule)"
        strokeWidth={1}
      />
      <text
        x={12}
        y={20}
        fontFamily="var(--font-mono)"
        fontSize={11}
        fill="var(--color-text-muted)"
      >
        server
      </text>
      <ComputeBox
        x={12}
        y={28}
        w={authoredWidth - 24}
        key96={key96}
        accept={accept}
        active={true}
        placeholder={placeholder}
      />
    </svg>
  );
}
