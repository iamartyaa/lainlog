"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { PRESS, SPRING, TIMING } from "@/lib/motion";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { TextHighlighter } from "@/components/fancy";
import { WidgetShell } from "./WidgetShell";

const HL_COLOR =
  "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

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

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

type Computed = {
  key: string;
  accept: string;
};

const PLACEHOLDER: Computed = {
  key: "dGhlIHNhbXBsZSBub25jZQ==",
  // SHA-1("dGhlIHNhbXBsZSBub25jZQ==" + GUID) base64-encoded — the literal example from RFC 6455 §1.3.
  accept: "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=",
};

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

async function makeAccept(key: string): Promise<string> {
  const combined = new TextEncoder().encode(key + GUID);
  const digest = await crypto.subtle.digest("SHA-1", combined);
  return bytesToB64(new Uint8Array(digest));
}

function randomKey(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return bytesToB64(buf);
}

export function UpgradeHandshake() {
  const [step, setStep] = useState(0);
  const [computed, setComputed] = useState<Computed>(PLACEHOLDER);
  const [rerolling, setRerolling] = useState(false);
  const [hashMs, setHashMs] = useState<number | null>(null);
  const mounted = useRef(false);

  const reroll = useCallback(async () => {
    setRerolling(true);
    const key = randomKey();
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const accept = await makeAccept(key);
    const t1 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    setHashMs(t1 - t0);
    setComputed({ key, accept });
    setRerolling(false);
  }, []);

  // Compute once on mount so the reader sees *their* browser's hash, not the spec's sample.
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    void reroll();
  }, [reroll]);

  const timingLabel =
    hashMs != null ? `SHA-1 in ${hashMs.toFixed(2)} ms` : "SHA-1 ready";

  return (
    <WidgetShell
      title="how HTTP ends mid-socket"
      measurements={timingLabel}
      caption={CAPTIONS[step]}
      captionTone="prominent"
      controls={
        <div className="flex flex-wrap items-center justify-center gap-[var(--spacing-md)] w-full">
          <WidgetNav value={step} total={3} onChange={setStep} />
          <motion.button
            type="button"
            onClick={reroll}
            disabled={rerolling}
            aria-label="Regenerate key and recompute accept hash"
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center font-mono transition-colors"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text)",
              border: "1px solid var(--color-rule)",
            }}
            {...PRESS}
          >
            {rerolling ? "hashing…" : "regenerate key"}
          </motion.button>
        </div>
      }
    >
      <div className="bs-uh-narrow">
        <MemoHandshakeCanvasNarrow step={step} computed={computed} />
      </div>
      <div className="bs-uh-wide">
        <MemoHandshakeCanvas step={step} computed={computed} />
      </div>
    </WidgetShell>
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

/* -------------------------------------------------------------------------- */

const MemoHandshakeCanvas = memo(HandshakeCanvas);
const MemoHandshakeCanvasNarrow = memo(HandshakeCanvasNarrow);

function HandshakeCanvas({ step, computed }: { step: number; computed: Computed }) {
  const WIDTH = 820;
  const HEIGHT = 460;

  const BROWSER_X = 20;
  const SERVER_X = 580;
  const BOX_W = 220;
  const PIPE_Y = 240;
  const PIPE_X1 = BROWSER_X + BOX_W + 4;
  const PIPE_X2 = SERVER_X - 4;

  // Wide variant — browser + server flanking a horizontal pipe. Used at
  // container widths ≥ --flip-wide. Below that, HandshakeCanvasNarrow flips
  // the whole arrangement vertical so 10 pt mono doesn't collapse on phone.
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
      role="img"
      aria-label={`Upgrade handshake step ${step + 1}`}
    >
      <defs>
        <marker
          id="uh-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-text-muted)" />
        </marker>
        <marker
          id="uh-arrow-accent"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--color-accent)" />
        </marker>
      </defs>

      {/* Browser box */}
      <PanelBox
        x={BROWSER_X}
        y={20}
        w={BOX_W}
        h={PIPE_Y - 40}
        label="browser"
      />
      <RequestPane x={BROWSER_X + 12} y={52} w={BOX_W - 24} key96={computed.key} highlight={step === 0} />

      {/* Server box */}
      <PanelBox
        x={SERVER_X}
        y={20}
        w={BOX_W}
        h={PIPE_Y - 40}
        label="server"
      />
      <ComputeBox
        x={SERVER_X + 12}
        y={52}
        w={BOX_W - 24}
        key96={computed.key}
        accept={computed.accept}
        active={step === 1}
      />

      {/* The pipe (TCP socket) — two layers. The muted HTTP base line stays
          drawn; the terracotta WebSocket overlay strokes itself in when
          step ≥ 2, left-to-right. Conveys the HTTP→socket transition as a
          visible act instead of a discrete color swap. */}
      <line
        x1={PIPE_X1}
        x2={PIPE_X2}
        y1={PIPE_Y}
        y2={PIPE_Y}
        stroke="var(--color-text-muted)"
        strokeWidth={1.4}
        strokeDasharray="4 4"
        opacity={step >= 2 ? 0.25 : 1}
      />
      {step >= 2 ? (
        <motion.line
          key={`uh-wide-pipe-${step}`}
          x1={PIPE_X1}
          x2={PIPE_X2}
          y1={PIPE_Y}
          y2={PIPE_Y}
          stroke="var(--color-accent)"
          strokeWidth={3.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ ...SPRING.smooth }}
        />
      ) : null}
      <text
        x={(PIPE_X1 + PIPE_X2) / 2}
        y={PIPE_Y - 10}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill={step >= 2 ? "var(--color-accent)" : "var(--color-text-muted)"}
      >
        {step >= 2 ? "WebSocket · framed binary" : "HTTP/1.1 over TCP"}
      </text>

      {/* Step 1: request envelope travels →. Fully hide once past step 0 so the
          pipe carries only one message at a time — otherwise the request
          envelope lingers dimmed while the server reply appears at the same x. */}
      <motion.g
        initial={false}
        animate={{
          opacity: step === 0 ? 1 : 0,
          x: step >= 1 ? PIPE_X2 - PIPE_X1 - 90 : 0,
        }}
        transition={{ ...SPRING.smooth, delay: step === 0 ? 0.1 : 0 }}
      >
        <g transform={`translate(${PIPE_X1 + 8}, ${PIPE_Y - 18})`}>
          <rect
            x={0}
            y={0}
            width={90}
            height={32}
            rx={4}
            fill="color-mix(in oklab, var(--color-surface) 70%, transparent)"
            stroke="var(--color-text-muted)"
            strokeWidth={1}
          />
          <text
            x={45}
            y={14}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill="var(--color-text-muted)"
          >
            GET /chat
          </text>
          <text
            x={45}
            y={26}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={9}
            fill="var(--color-text-muted)"
          >
            Upgrade: websocket
          </text>
        </g>
      </motion.g>

      {/* Step 2: 101 response travels ← */}
      <motion.g
        initial={false}
        animate={{
          opacity: step === 1 ? 1 : step >= 2 ? 0 : 0,
          x: step >= 2 ? -(PIPE_X2 - PIPE_X1 - 110) : 0,
        }}
        transition={{ ...SPRING.smooth, delay: step === 1 ? 0.7 : 0 }}
      >
        <g transform={`translate(${PIPE_X2 - 108}, ${PIPE_Y - 18})`}>
          <rect
            x={0}
            y={0}
            width={100}
            height={32}
            rx={4}
            fill="color-mix(in oklab, var(--color-accent) 16%, transparent)"
            stroke="var(--color-accent)"
            strokeWidth={1.2}
          />
          <text
            x={50}
            y={14}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill="var(--color-accent)"
          >
            101 Switching
          </text>
          <text
            x={50}
            y={26}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={9}
            fill="var(--color-accent)"
          >
            Sec-WebSocket-Accept
          </text>
        </g>
      </motion.g>

      {/* Step 3: bidirectional WS frames */}
      {step >= 2 ? <FrameTraffic x1={PIPE_X1} x2={PIPE_X2} y={PIPE_Y} /> : null}

      {/* Response transcript below the pipe */}
      <g transform={`translate(${BROWSER_X}, ${PIPE_Y + 40})`}>
        <text
          x={0}
          y={0}
          fontFamily="var(--font-sans)"
          fontSize={11}
          fontWeight={500}
          fill="var(--color-text-muted)"
        >
          what goes on the wire
        </text>
      </g>
      <g transform={`translate(${BROWSER_X}, ${PIPE_Y + 56})`}>
        <Transcript step={step} computed={computed} width={WIDTH - BROWSER_X * 2} />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Narrow (mobile)                               */
/* -------------------------------------------------------------------------- */

/**
 * HandshakeCanvasNarrow — vertical orientation for phone widths. Browser
 * panel sits above a vertical TCP pipe; server panel sits below. The
 * request envelope drops down the pipe on step 0→1; the 101 reply rises
 * on step 1→2; bidirectional frames fly up/down on step 3. The transcript
 * panes render as plain HTML below the SVG — mono text readable at
 * actual type size, not a shrunk SVG <text>.
 */
function HandshakeCanvasNarrow({
  step,
  computed,
}: {
  step: number;
  computed: Computed;
}) {
  // Authored at 340 / 288 to read clean at iPhone SE (375 viewport, ~343
  // usable px). interaction-rules R5 + user directive 5.
  const WIDTH = 340;
  const HEIGHT = 320;
  const PIPE_X = WIDTH / 2;
  const BROWSER_Y = 40;
  const SERVER_Y = 224;
  const BOX_W = 288;
  const BOX_H = 84;
  const BOX_X = (WIDTH - BOX_W) / 2;
  const PIPE_Y1 = BROWSER_Y + BOX_H + 6;
  const PIPE_Y2 = SERVER_Y - 6;

  return (
    <div className="flex flex-col gap-[var(--spacing-sm)]">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`Upgrade handshake, step ${step + 1} of 3, compact layout`}
      >
        {/* Browser panel */}
        <rect
          x={BOX_X}
          y={BROWSER_Y}
          width={BOX_W}
          height={BOX_H}
          rx={6}
          fill="color-mix(in oklab, var(--color-surface) 55%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={BOX_X + 10}
          y={BROWSER_Y + 18}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill="var(--color-text-muted)"
        >
          browser
        </text>
        <text
          x={BOX_X + 10}
          y={BROWSER_Y + 38}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill={step === 0 ? "var(--color-accent)" : "var(--color-text)"}
          fontWeight={step === 0 ? 500 : 400}
        >
          GET /chat HTTP/1.1
        </text>
        <text
          x={BOX_X + 10}
          y={BROWSER_Y + 56}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill={step === 0 ? "var(--color-accent)" : "var(--color-text)"}
        >
          Upgrade: websocket
        </text>
        <text
          x={BOX_X + 10}
          y={BROWSER_Y + 72}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="var(--color-text-muted)"
        >
          key = {truncate(computed.key, 20)}
        </text>

        {/* Vertical pipe — two layers. The muted HTTP base line is always
            there; the terracotta WebSocket overlay strokes itself in
            (pathLength 0→1) when step ≥ 2. Conveys the "HTTP became a
            socket" transformation as a visible act, not a discrete swap. */}
        <line
          x1={PIPE_X}
          x2={PIPE_X}
          y1={PIPE_Y1}
          y2={PIPE_Y2}
          stroke="var(--color-text-muted)"
          strokeWidth={1.4}
          strokeDasharray="4 4"
          opacity={step >= 2 ? 0.25 : 1}
        />
        {step >= 2 ? (
          <motion.line
            key={`ws-pipe-${step}`}
            x1={PIPE_X}
            x2={PIPE_X}
            y1={PIPE_Y1}
            y2={PIPE_Y2}
            stroke="var(--color-accent)"
            strokeWidth={3.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ ...SPRING.smooth }}
          />
        ) : null}
        <text
          x={PIPE_X + 10}
          y={(PIPE_Y1 + PIPE_Y2) / 2}
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill={step >= 2 ? "var(--color-accent)" : "var(--color-text-muted)"}
        >
          {step >= 2 ? "WebSocket" : "HTTP/1.1"}
        </text>

        {/* Step 1: request envelope falls from browser to server */}
        <motion.g
          initial={false}
          animate={{
            opacity: step === 0 ? 1 : 0,
            y: step >= 1 ? PIPE_Y2 - PIPE_Y1 - 24 : 0,
          }}
          transition={{ ...SPRING.smooth, delay: step === 0 ? 0.1 : 0 }}
        >
          <g transform={`translate(${PIPE_X - 38}, ${PIPE_Y1 + 8})`}>
            <rect
              x={0}
              y={0}
              width={76}
              height={24}
              rx={4}
              fill="color-mix(in oklab, var(--color-surface) 70%, transparent)"
              stroke="var(--color-text-muted)"
              strokeWidth={1}
            />
            <text
              x={38}
              y={16}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill="var(--color-text-muted)"
            >
              Upgrade req
            </text>
          </g>
        </motion.g>

        {/* Step 2: 101 response rises from server to browser */}
        <motion.g
          initial={false}
          animate={{
            opacity: step === 1 ? 1 : 0,
            y: step >= 2 ? -(PIPE_Y2 - PIPE_Y1 - 30) : 0,
          }}
          transition={{ ...SPRING.smooth, delay: step === 1 ? 0.7 : 0 }}
        >
          <g transform={`translate(${PIPE_X - 42}, ${PIPE_Y2 - 32})`}>
            <rect
              x={0}
              y={0}
              width={84}
              height={24}
              rx={4}
              fill="color-mix(in oklab, var(--color-accent) 16%, transparent)"
              stroke="var(--color-accent)"
              strokeWidth={1.2}
            />
            <text
              x={42}
              y={16}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill="var(--color-accent)"
            >
              101 Switching
            </text>
          </g>
        </motion.g>

        {/* Step 3: bidirectional frames */}
        {step >= 2 ? (
          <NarrowFrameTraffic
            pipeX={PIPE_X}
            y1={PIPE_Y1 + 8}
            y2={PIPE_Y2 - 8}
          />
        ) : null}

        {/* Server panel */}
        <rect
          x={BOX_X}
          y={SERVER_Y}
          width={BOX_W}
          height={BOX_H}
          rx={6}
          fill="color-mix(in oklab, var(--color-surface) 55%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={BOX_X + 10}
          y={SERVER_Y + 18}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill="var(--color-text-muted)"
        >
          server
        </text>
        <text
          x={BOX_X + 10}
          y={SERVER_Y + 38}
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill={step === 1 ? "var(--color-accent)" : "var(--color-text)"}
          fontWeight={step === 1 ? 500 : 400}
        >
          SHA-1(key + GUID)
        </text>
        <NarrowAcceptSettle
          accept={truncate(computed.accept, 20)}
          x={BOX_X + 10}
          y={SERVER_Y + 58}
        />
        <text
          x={BOX_X + 10}
          y={SERVER_Y + 74}
          fontFamily="var(--font-mono)"
          fontSize={9}
          fill="var(--color-text-muted)"
        >
          GUID = 258EAFA5-E914-…
        </text>
      </svg>

      {/* HTML transcript below. Renders at real --text-small so the reader
          gets mono text at body-readable size instead of SVG-scaled. */}
      <div
        className="grid gap-[var(--spacing-sm)] sm:grid-cols-2"
        style={{ fontSize: "var(--text-small)" }}
      >
        <TranscriptPane
          title="client → server"
          active={step === 0}
          lines={[
            "GET /chat HTTP/1.1",
            "Host: docs.example",
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Key: ${truncate(computed.key, 20)}`,
            "Sec-WebSocket-Version: 13",
          ]}
          highlight={(line) =>
            step === 0 &&
            (line.startsWith("Upgrade:") ||
              line.startsWith("Connection:") ||
              line.startsWith("Sec-WebSocket-Key"))
          }
        />
        <TranscriptPane
          title="server → client"
          active={step >= 1}
          lines={[
            "HTTP/1.1 101 Switching Protocols",
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Accept: ${truncate(computed.accept, 20)}`,
          ]}
          highlight={(line) =>
            step === 1 &&
            (line.startsWith("HTTP/1.1 101") ||
              line.startsWith("Sec-WebSocket-Accept"))
          }
        />
      </div>
    </div>
  );
}

function NarrowFrameTraffic({
  pipeX,
  y1,
  y2,
}: {
  pipeX: number;
  y1: number;
  y2: number;
}) {
  const span = y2 - y1;
  return (
    <g>
      {/* Frame traveling ↓ — one-shot spring */}
      <motion.g
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: span, opacity: 1 }}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <rect
          x={pipeX - 18}
          y={y1}
          width={14}
          height={18}
          rx={2}
          fill="var(--color-accent)"
        />
        <text
          x={pipeX - 11}
          y={y1 + 12}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={8}
          fill="var(--color-bg)"
        >
          0x1
        </text>
      </motion.g>
      {/* Frame traveling ↑ — one-shot spring, staggered */}
      <motion.g
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: -span, opacity: 1 }}
        transition={{ ...SPRING.smooth, delay: 0.45 }}
      >
        <rect
          x={pipeX + 4}
          y={y2 - 18}
          width={14}
          height={18}
          rx={2}
          fill="var(--color-accent)"
        />
        <text
          x={pipeX + 11}
          y={y2 - 6}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={8}
          fill="var(--color-bg)"
        >
          0x2
        </text>
      </motion.g>
      {/* Static endpoint dots — colour alone signals endpoint. No motion. */}
      <circle cx={pipeX} cy={y1} r={3} fill="var(--color-accent)" />
      <circle cx={pipeX} cy={y2} r={3} fill="var(--color-accent)" />
    </g>
  );
}

function NarrowAcceptSettle({
  accept,
  x,
  y,
}: {
  accept: string;
  x: number;
  y: number;
}) {
  const SPLIT = Math.max(0, accept.length - 8);
  const head = accept.slice(0, SPLIT);
  const tail = accept.slice(SPLIT).split("");
  return (
    <text
      key={accept}
      x={x}
      y={y}
      fontFamily="var(--font-mono)"
      fontSize={11}
    >
      <tspan fill="var(--color-accent)">{head}</tspan>
      {tail.map((ch, i) => (
        <motion.tspan
          key={`${accept}-${i}`}
          initial={{ fill: "var(--color-text-muted)" }}
          animate={{ fill: "var(--color-accent)" }}
          transition={{ ...TIMING.base, delay: 0.08 + i * 0.035 }}
        >
          {ch}
        </motion.tspan>
      ))}
    </text>
  );
}

function TranscriptPane({
  title,
  lines,
  active,
  highlight,
}: {
  title: string;
  lines: string[];
  active: boolean;
  highlight: (line: string) => boolean;
}) {
  return (
    <div
      className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)]"
      style={{
        background: "color-mix(in oklab, var(--color-surface) 50%, transparent)",
        border: "1px solid var(--color-rule)",
        opacity: active ? 1 : 0.6,
      }}
    >
      <div
        className="font-sans uppercase"
        style={{
          fontSize: "var(--text-small)",
          letterSpacing: "0.04em",
          color: "var(--color-text-muted)",
          marginBottom: "var(--spacing-2xs)",
        }}
      >
        {title}
      </div>
      <pre
        className="font-mono"
        style={{
          fontSize: "var(--text-small)",
          lineHeight: 1.5,
          color: "var(--color-text)",
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: highlight(line) ? "var(--color-accent)" : undefined,
              fontWeight: highlight(line) ? 500 : undefined,
            }}
          >
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}

function PanelBox({
  x,
  y,
  w,
  h,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill="color-mix(in oklab, var(--color-surface) 55%, transparent)"
        stroke="var(--color-rule)"
        strokeWidth={1}
      />
      <text
        x={x + 12}
        y={y + 20}
        fontFamily="var(--font-mono)"
        fontSize={11}
        fill="var(--color-text-muted)"
      >
        {label}
      </text>
    </g>
  );
}

function RequestPane({
  x,
  y,
  w,
  key96,
  highlight,
}: {
  x: number;
  y: number;
  w: number;
  key96: string;
  highlight: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {[
        "GET /chat HTTP/1.1",
        "Host: docs.example",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${truncate(key96, 16)}`,
        "Sec-WebSocket-Version: 13",
      ].map((line, i) => {
        const isUpgrade = line.startsWith("Upgrade") || line.startsWith("Connection") || line.startsWith("Sec-WebSocket-Key");
        return (
          <text
            key={line}
            x={0}
            y={i * 16 + 10}
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill={
              highlight && isUpgrade
                ? "var(--color-accent)"
                : "var(--color-text)"
            }
            fontWeight={highlight && isUpgrade ? 500 : 400}
          >
            {line}
          </text>
        );
      })}
      {/* An unused `w` rect keeps the pane size stable across re-renders. */}
      <rect x={0} y={0} width={w} height={1} fill="transparent" />
    </g>
  );
}

function ComputeBox({
  x,
  y,
  w,
  key96,
  accept,
  active,
}: {
  x: number;
  y: number;
  w: number;
  key96: string;
  accept: string;
  active: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <text x={0} y={10} fontFamily="var(--font-mono)" fontSize={10} fill="var(--color-text-muted)">
        key = {truncate(key96, 14)}
      </text>
      <text x={0} y={28} fontFamily="var(--font-mono)" fontSize={10} fill="var(--color-text-muted)">
        GUID = 258EAFA5-E914-…
      </text>
      <motion.text
        x={0}
        y={50}
        fontFamily="var(--font-mono)"
        fontSize={11}
        fill={active ? "var(--color-accent)" : "var(--color-text)"}
        initial={false}
        animate={{ opacity: active ? 1 : 0.75 }}
        transition={SPRING.smooth}
      >
        SHA-1(key + GUID)
      </motion.text>
      <line x1={0} x2={w - 8} y1={58} y2={58} stroke="var(--color-rule)" strokeWidth={1} strokeDasharray="2 3" />
      <text
        x={0}
        y={76}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        base64 →
      </text>
      <AcceptSettle accept={truncate(accept, 18)} y={94} />
      <rect x={0} y={0} width={w} height={1} fill="transparent" />
    </g>
  );
}

/**
 * AcceptSettle — renders the Sec-WebSocket-Accept value so the trailing
 * characters flash terracotta then settle to text colour on each regenerate.
 * Only characters that change on a re-roll (the full string, in practice)
 * animate; keying on the value itself forces a remount, so no manual diffing.
 * Teaching signal: the reader sees which bytes their browser just produced.
 */
function AcceptSettle({ accept, y }: { accept: string; y: number }) {
  // Split: keep the first few characters static as an anchor, animate the tail.
  const SPLIT = Math.max(0, accept.length - 8);
  const head = accept.slice(0, SPLIT);
  const tail = accept.slice(SPLIT).split("");
  return (
    <text
      key={accept}
      x={0}
      y={y}
      fontFamily="var(--font-mono)"
      fontSize={11}
    >
      <tspan fill="var(--color-accent)">{head}</tspan>
      {tail.map((ch, i) => (
        <motion.tspan
          key={`${accept}-${i}`}
          initial={{ fill: "var(--color-text-muted)" }}
          animate={{ fill: "var(--color-accent)" }}
          transition={{ ...TIMING.base, delay: 0.08 + i * 0.035 }}
        >
          {ch}
        </motion.tspan>
      ))}
    </text>
  );
}

/**
 * FrameTraffic — step-3 bidirectional frame demo.
 *
 * One-shot teaching pass: a downstream frame and an upstream frame each
 * traverse the pipe exactly once, settled by a spring, then come to rest at
 * the far endpoint. Static terracotta dots mark the two endpoints — "socket
 * open, either side may speak" — without infinite loops (DESIGN.md §9).
 */
function FrameTraffic({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g>
      {/* Frame traveling → — single one-shot pass, springs to rest */}
      <motion.g
        initial={{ x: x1 + 20, opacity: 0 }}
        animate={{ x: x2 - 30, opacity: 1 }}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <rect x={0} y={y - 8} width={22} height={14} rx={2} fill="var(--color-accent)" />
        <text
          x={11}
          y={y + 1}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={8}
          fill="var(--color-bg)"
        >
          0x1
        </text>
      </motion.g>
      {/* Frame traveling ← — staggered, single one-shot pass, springs to rest */}
      <motion.g
        initial={{ x: x2 - 40, opacity: 0 }}
        animate={{ x: x1 - 10, opacity: 1 }}
        transition={{ ...SPRING.smooth, delay: 0.45 }}
      >
        <rect x={0} y={y + 12} width={22} height={14} rx={2} fill="var(--color-accent)" />
        <text
          x={11}
          y={y + 21}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={8}
          fill="var(--color-bg)"
        >
          0x2
        </text>
      </motion.g>
      {/* Static endpoint dots — colour alone signals "endpoint." No motion. */}
      <circle cx={x1 + 2} cy={y} r={3} fill="var(--color-accent)" />
      <circle cx={x2 - 2} cy={y} r={3} fill="var(--color-accent)" />
      <text
        x={(x1 + x2) / 2}
        y={y + 44}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={9}
        fill="var(--color-text-muted)"
      >
        opcodes: 0x1 text · 0x2 binary · 0x8 close · 0x9 ping · 0xA pong
      </text>
    </g>
  );
}

function Transcript({
  step,
  computed,
  width,
}: {
  step: number;
  computed: Computed;
  width: number;
}) {
  const reqLines = [
    "GET /chat HTTP/1.1",
    "Host: docs.example",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Key: ${truncate(computed.key, 24)}`,
    "Sec-WebSocket-Version: 13",
    "",
  ];
  const resLines = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${truncate(computed.accept, 24)}`,
    "",
  ];
  const rightX = width / 2 + 10;

  return (
    <g>
      {/* Left: request */}
      <text x={0} y={0} fontFamily="var(--font-mono)" fontSize={9} fill="var(--color-text-muted)">
        client → server
      </text>
      {reqLines.map((line, i) => {
        const isSpecial =
          line.startsWith("Upgrade:") ||
          line.startsWith("Connection:") ||
          line.startsWith("Sec-WebSocket-Key");
        return (
          <text
            key={`req-${i}`}
            x={0}
            y={16 + i * 13}
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill={isSpecial && step === 0 ? "var(--color-accent)" : "var(--color-text)"}
            opacity={step >= 2 ? 0.55 : 1}
          >
            {line}
          </text>
        );
      })}

      {/* Right: response */}
      <text x={rightX} y={0} fontFamily="var(--font-mono)" fontSize={9} fill="var(--color-text-muted)">
        server → client
      </text>
      {resLines.map((line, i) => {
        const isSpecial =
          line.startsWith("HTTP/1.1 101") || line.startsWith("Sec-WebSocket-Accept");
        const visible = step >= 1;
        return (
          <text
            key={`res-${i}`}
            x={rightX}
            y={16 + i * 13}
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill={isSpecial && step === 1 ? "var(--color-accent)" : "var(--color-text)"}
            opacity={visible ? (step >= 2 ? 0.7 : 1) : 0.25}
          >
            {line}
          </text>
        );
      })}
    </g>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
