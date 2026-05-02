"use client";

import { memo, useState } from "react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { TextHighlighter } from "@/components/fancy";
import { WidgetShell } from "@/components/viz/WidgetShell";
import {
  SPEC_SAMPLE,
  StepsCanvasNarrow,
  StepsCanvasWide,
} from "./_handshake-shared";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

const MemoStepsCanvasWide = memo(StepsCanvasWide);
const MemoStepsCanvasNarrow = memo(StepsCanvasNarrow);

function CaptionCue({ children }: { children: React.ReactNode }) {
  return (
    <TextHighlighter
      triggerType="auto"
      transition={HL_TX}
      highlightColor={HL_COLOR}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

const CAPTIONS: React.ReactNode[] = [
  (
    <>
      <CaptionCue>Step through</CaptionCue> the upgrade. First, the browser
      sends a regular HTTP/1.1 request — three headers ask the server to stop
      being HTTP: Upgrade, Connection, and a random 16-byte key.
    </>
  ),
  (
    <>
      <CaptionCue>Step 2.</CaptionCue> The server glues the key onto a
      hardcoded GUID, SHA-1s it, base64s the digest, and sends that hash back.
      101 Switching Protocols rides along.
    </>
  ),
  (
    <>
      <CaptionCue>Step 3.</CaptionCue> HTTP is over. The same TCP socket now
      carries WebSocket frames (2–14 bytes of overhead). Either side can send,
      anytime.
    </>
  ),
];

/**
 * HandshakeSteps — §4 stepper widget. One verb (advance step). Walks the RFC
 * 6455 §1.3 spec sample — fixed key/accept across the whole interaction so
 * the reader can compare what the upgrade looks like on the wire to the
 * exact strings the spec writes down. No SHA-1 work runs here; this widget
 * is pure render of fixed values.
 */
export function HandshakeSteps() {
  const [step, setStep] = useState(0);

  return (
    <WidgetShell
      title="the 3-step upgrade"
      measurements="RFC 6455 §1.3 sample"
      state={CAPTIONS[step]}
      canvas={
        <>
          <div className="bs-uh-narrow">
            <MemoStepsCanvasNarrow step={step} computed={SPEC_SAMPLE} />
          </div>
          <div className="bs-uh-wide">
            <MemoStepsCanvasWide step={step} computed={SPEC_SAMPLE} />
          </div>
        </>
      }
      controls={
        <div className="flex items-center justify-center w-full">
          <WidgetNav value={step} total={3} onChange={setStep} />
        </div>
      }
    />
  );
}
