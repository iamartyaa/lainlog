"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { PRESS, SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";
import { WidgetShell } from "./WidgetShell";

type InputId = "dotted" | "tagged" | "both";

const INPUTS: { id: InputId; label: string; typed: string }[] = [
  { id: "dotted", label: "j.ohn.doe", typed: "j.ohn.doe@gmail.com" },
  { id: "tagged", label: "+netflix", typed: "johndoe+netflix@gmail.com" },
  { id: "both", label: "J.Ohn.Doe+x", typed: "J.Ohn.Doe+x@gmail.com" },
];

const CANONICAL = "johndoe@gmail.com";

/**
 * NetflixSplit — same email, two parsers. Gmail collapses every dotted /
 * +tagged variant down to one canonical inbox; Netflix treats each variant
 * as a brand-new customer. The dot-scam exists in the gap between those two
 * parsers. The widget makes the gap legible: pick a typed variant, watch
 * Gmail and Netflix interpret it side by side, see whose mailbox the
 * confirmation lands in (Gmail's — always).
 */
export function NetflixSplit() {
  const [pick, setPick] = useState<InputId>("dotted");
  const input = INPUTS.find((i) => i.id === pick) ?? INPUTS[0];

  const WIDTH = 360;
  const HEIGHT = 240;
  const PAD = 14;
  const TYPED_Y = 14;
  const TYPED_H = 36;
  const COL_Y = 80;
  const COL_H = 110;
  const COL_W = (WIDTH - PAD * 2 - 14) / 2;
  const COL_LEFT_X = PAD;
  const COL_RIGHT_X = PAD + COL_W + 14;
  const VERDICT_Y = HEIGHT - 14;

  return (
    <WidgetShell
      title="netflix vs gmail · same address, two accounts"
      measurements={`variant: ${input.label}`}
      caption={
        <>
          Gmail folds every variant down to{" "}
          <span className="font-mono">{CANONICAL}</span> — one inbox, one
          account. Netflix stores the address as typed, so each dotted or
          +tagged variant is a new customer. The confirmation email still
          lands in Gmail&apos;s canonical inbox. That gap is the attack
          surface.
        </>
      }
      controls={
        <div
          className="flex flex-wrap items-center gap-x-[var(--spacing-2xs)] font-sans"
          style={{ fontSize: "var(--text-ui)", minHeight: 44 }}
        >
          <span style={{ color: "var(--color-text-muted)" }}>variant ·</span>
          {INPUTS.map((i) => {
            const active = pick === i.id;
            return (
              <motion.button
                key={i.id}
                type="button"
                onClick={() => {
                  if (i.id !== pick) playSound("Toggle-On");
                  setPick(i.id);
                }}
                aria-pressed={active}
                aria-label={`variant: ${i.typed}`}
                className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center hover:text-[color:var(--color-accent)] ml-[var(--spacing-2xs)]"
                style={{
                  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                  textDecoration: active ? "underline" : "none",
                }}
                {...PRESS}
              >
                {i.label}
              </motion.button>
            );
          })}
        </div>
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`Netflix-split widget. Variant: ${input.typed}. Gmail canonical: ${CANONICAL}. Netflix stores: ${input.typed}.`}
      >
        {/* Typed input strip */}
        <rect
          x={PAD}
          y={TYPED_Y}
          width={WIDTH - PAD * 2}
          height={TYPED_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 40%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={PAD + 10}
          y={TYPED_Y + TYPED_H / 2}
          dominantBaseline="central"
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          TYPED
        </text>
        <text
          x={WIDTH / 2}
          y={TYPED_Y + TYPED_H / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={13}
          fill="var(--color-text)"
        >
          <motion.tspan
            key={`typed-${pick}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.smooth}
          >
            {input.typed}
          </motion.tspan>
        </text>

        {/* Splitter line */}
        <line
          x1={WIDTH / 2}
          y1={TYPED_Y + TYPED_H}
          x2={WIDTH / 2}
          y2={COL_Y - 6}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          opacity={0.4}
        />
        <line
          x1={COL_LEFT_X + COL_W / 2}
          y1={COL_Y - 6}
          x2={COL_RIGHT_X + COL_W / 2}
          y2={COL_Y - 6}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          opacity={0.4}
        />
        <line
          x1={COL_LEFT_X + COL_W / 2}
          y1={COL_Y - 6}
          x2={COL_LEFT_X + COL_W / 2}
          y2={COL_Y}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          opacity={0.4}
        />
        <line
          x1={COL_RIGHT_X + COL_W / 2}
          y1={COL_Y - 6}
          x2={COL_RIGHT_X + COL_W / 2}
          y2={COL_Y}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          opacity={0.4}
        />

        {/* Gmail column */}
        <g>
          <rect
            x={COL_LEFT_X}
            y={COL_Y}
            width={COL_W}
            height={COL_H}
            rx={3}
            fill="color-mix(in oklab, var(--color-accent) 10%, transparent)"
            stroke="var(--color-accent)"
            strokeWidth={1.4}
          />
          <text
            x={COL_LEFT_X + COL_W / 2}
            y={COL_Y + 18}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-accent)"
            letterSpacing="0.08em"
          >
            GMAIL
          </text>
          <text
            x={COL_LEFT_X + COL_W / 2}
            y={COL_Y + 36}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
          >
            normalises ↓
          </text>
          <text
            x={COL_LEFT_X + COL_W / 2}
            y={COL_Y + 60}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill="var(--color-text)"
          >
            <motion.tspan
              key={`g-${pick}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.smooth}
            >
              {CANONICAL}
            </motion.tspan>
          </text>
          <text
            x={COL_LEFT_X + COL_W / 2}
            y={COL_Y + COL_H - 14}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-text-muted)"
          >
            same inbox · existing user
          </text>
        </g>

        {/* Netflix column */}
        <g>
          <rect
            x={COL_RIGHT_X}
            y={COL_Y}
            width={COL_W}
            height={COL_H}
            rx={3}
            fill="transparent"
            stroke="var(--color-text)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text
            x={COL_RIGHT_X + COL_W / 2}
            y={COL_Y + 18}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-text)"
            letterSpacing="0.08em"
          >
            NETFLIX
          </text>
          <text
            x={COL_RIGHT_X + COL_W / 2}
            y={COL_Y + 36}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
          >
            stores as typed ↓
          </text>
          <text
            x={COL_RIGHT_X + COL_W / 2}
            y={COL_Y + 60}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={11}
            fill="var(--color-text)"
          >
            <motion.tspan
              key={`n-${pick}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.smooth}
            >
              {input.typed}
            </motion.tspan>
          </text>
          <text
            x={COL_RIGHT_X + COL_W / 2}
            y={COL_Y + COL_H - 14}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-text-muted)"
          >
            new customer · new bill
          </text>
        </g>

        {/* Verdict line */}
        <text
          x={WIDTH / 2}
          y={VERDICT_Y}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill="var(--color-text)"
        >
          confirmation email →{" "}
          <tspan fill="var(--color-accent)">{CANONICAL}</tspan>
        </text>
      </svg>
    </WidgetShell>
  );
}
