"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PRESS, SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

const SAMPLE = "johndoe@gmail.com";
const KEYSTROKE_MS = 90; // human-realistic typing cadence
const DEBOUNCE_MS = 300; // browser-side wait before firing the check

type Phase = "idle" | "typing" | "waiting" | "fired";

/**
 * TypingPause — what actually happens between keystrokes. The browser doesn't
 * fire a check per keystroke; it waits for ~300 ms of silence. Each new
 * keystroke restarts the timer. Only when the user stops does the request go.
 *
 * State 0 on mount: input is empty, no timer, no fire. Tap "play" to type the
 * sample address; tap any letter button mid-typing to add a keystroke and
 * watch the wait restart.
 */
export function TypingPause() {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [waitMs, setWaitMs] = useState(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAllTimers = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (waitTimer.current) clearInterval(waitTimer.current);
    typingTimer.current = null;
    waitTimer.current = null;
  };

  useEffect(() => () => stopAllTimers(), []);

  const startWaitCountdown = () => {
    if (waitTimer.current) clearInterval(waitTimer.current);
    setPhase("waiting");
    setWaitMs(0);
    if (reduced) {
      // Reduced-motion: collapse the 300 ms wait into an instant fire.
      setWaitMs(DEBOUNCE_MS);
      setPhase("fired");
      return;
    }
    const tickMs = 30;
    waitTimer.current = setInterval(() => {
      setWaitMs((ms) => {
        const next = ms + tickMs;
        if (next >= DEBOUNCE_MS) {
          if (waitTimer.current) clearInterval(waitTimer.current);
          waitTimer.current = null;
          setPhase("fired");
          return DEBOUNCE_MS;
        }
        return next;
      });
    }, tickMs);
  };

  const playSample = () => {
    stopAllTimers();
    setTyped("");
    setWaitMs(0);
    setPhase("typing");
    if (reduced) {
      setTyped(SAMPLE);
      startWaitCountdown();
      return;
    }
    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(SAMPLE.slice(0, i));
      if (i < SAMPLE.length) {
        typingTimer.current = setTimeout(tick, KEYSTROKE_MS);
      } else {
        typingTimer.current = null;
        startWaitCountdown();
      }
    };
    typingTimer.current = setTimeout(tick, KEYSTROKE_MS);
  };

  const addKeystroke = () => {
    stopAllTimers();
    setPhase("typing");
    setWaitMs(0);
    setTyped((t) => (t + ".").slice(-SAMPLE.length));
    typingTimer.current = setTimeout(() => {
      typingTimer.current = null;
      startWaitCountdown();
    }, KEYSTROKE_MS);
  };

  const reset = () => {
    stopAllTimers();
    setTyped("");
    setWaitMs(0);
    setPhase("idle");
  };

  // Geometry — mobile-first 360-unit canvas.
  const WIDTH = 360;
  const HEIGHT = 170;
  const PAD = 18;
  const INPUT_Y = 28;
  const INPUT_H = 38;
  const BAR_Y = 92;
  const BAR_H = 8;
  const FIRE_Y = 132;

  const barFill = waitMs / DEBOUNCE_MS;
  const fireOn = phase === "fired";

  return (
    <WidgetShell
      title="the pause · why nothing fires per keystroke"
      measurements={
        phase === "fired"
          ? "fired · 1 request"
          : phase === "waiting"
            ? `waiting · ${Math.min(waitMs, DEBOUNCE_MS)}/${DEBOUNCE_MS} ms`
            : phase === "typing"
              ? "typing · timer paused"
              : "idle"
      }
      caption={
        phase === "idle"
          ? "Tap play to type a sample address. The check fires only after you stop."
          : phase === "typing"
            ? "Mid-keystroke. The 300 ms wait hasn't started yet — every new key restarts it."
            : phase === "waiting"
              ? "Typing stopped. The browser is waiting 300 ms. If you keystroke again, this resets to zero."
              : "Silence reached 300 ms. One request goes out — for the whole address, not one per key."
      }
      controls={
        <div className="flex flex-wrap items-center gap-[var(--spacing-sm)]" style={{ minHeight: 44 }}>
          <motion.button
            type="button"
            onClick={playSample}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center hover:text-[color:var(--color-accent)]"
            style={{ fontSize: "var(--text-ui)", color: "var(--color-text)" }}
            {...PRESS}
          >
            ▸ play sample
          </motion.button>
          <motion.button
            type="button"
            onClick={addKeystroke}
            disabled={phase === "fired" || typed.length === 0}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center hover:enabled:text-[color:var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontSize: "var(--text-ui)", color: "var(--color-text-muted)" }}
            aria-label="add a keystroke and reset the 300 ms wait"
            {...PRESS}
          >
            + keystroke
          </motion.button>
          <motion.button
            type="button"
            onClick={reset}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center hover:text-[color:var(--color-accent)] ml-auto"
            style={{ fontSize: "var(--text-ui)", color: "var(--color-text-muted)" }}
            {...PRESS}
          >
            ↻ reset
          </motion.button>
        </div>
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`Typing-pause demo. ${phase === "fired" ? "Request fired." : phase === "waiting" ? `Waiting ${waitMs} of 300 ms.` : phase === "typing" ? "Typing in progress." : "Idle."}`}
      >
        {/* Faux input box */}
        <rect
          x={PAD}
          y={INPUT_Y}
          width={WIDTH - PAD * 2}
          height={INPUT_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 40%, transparent)"
          stroke={phase === "typing" ? "var(--color-accent)" : "var(--color-rule)"}
          strokeWidth={phase === "typing" ? 1.6 : 1}
        />
        <text
          x={PAD + 10}
          y={INPUT_Y + INPUT_H / 2}
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={13}
          fill="var(--color-text)"
        >
          {typed}
          {phase === "typing" || phase === "idle" ? (
            <tspan
              fill="var(--color-text-muted)"
              opacity={0.6}
            >
              {"▍"}
            </tspan>
          ) : null}
        </text>
        <text
          x={WIDTH - PAD - 10}
          y={INPUT_Y + INPUT_H / 2}
          textAnchor="end"
          dominantBaseline="central"
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          INPUT
        </text>

        {/* Wait countdown bar */}
        <text
          x={PAD}
          y={BAR_Y - 8}
          fontFamily="var(--font-sans)"
          fontSize={10}
          fill="var(--color-text-muted)"
        >
          300 ms wait
        </text>
        <rect
          x={PAD}
          y={BAR_Y}
          width={WIDTH - PAD * 2}
          height={BAR_H}
          rx={1}
          fill="color-mix(in oklab, var(--color-surface) 30%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <motion.rect
          x={PAD}
          y={BAR_Y}
          height={BAR_H}
          rx={1}
          fill="var(--color-accent)"
          initial={false}
          animate={{ width: (WIDTH - PAD * 2) * barFill }}
          transition={SPRING.smooth}
        />
        <text
          x={WIDTH - PAD}
          y={BAR_Y - 8}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill="var(--color-text-muted)"
        >
          {phase === "fired" ? "300" : Math.min(waitMs, DEBOUNCE_MS)} / {DEBOUNCE_MS}
        </text>

        {/* Fire indicator */}
        <motion.circle
          cx={PAD + 8}
          cy={FIRE_Y}
          r={6}
          fill={fireOn ? "var(--color-accent)" : "transparent"}
          stroke={fireOn ? "var(--color-accent)" : "var(--color-rule)"}
          strokeWidth={1.4}
          initial={false}
          animate={{ scale: fireOn ? [1, 1.3, 1] : 1 }}
          transition={fireOn ? { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } : SPRING.smooth}
        />
        <text
          x={PAD + 22}
          y={FIRE_Y}
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill={fireOn ? "var(--color-accent)" : "var(--color-text-muted)"}
        >
          {fireOn ? `request → server : "${SAMPLE}"` : "request not fired yet"}
        </text>
      </svg>
    </WidgetShell>
  );
}
