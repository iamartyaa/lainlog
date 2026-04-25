"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PRESS, SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type Method = "GET" | "POST" | "PUT" | "DELETE";
type ContentType =
  | "text/plain"
  | "application/x-www-form-urlencoded"
  | "application/json";

const METHODS: Method[] = ["GET", "POST", "PUT", "DELETE"];
const CONTENT_TYPES: ContentType[] = [
  "text/plain",
  "application/x-www-form-urlencoded",
  "application/json",
];

const SAFE_METHODS = new Set<Method>(["GET", "POST"]);

type Reason = { text: string; key: string };

function classify(
  method: Method,
  contentType: ContentType,
  auth: boolean,
  custom: boolean,
): { preflight: boolean; reasons: Reason[] } {
  const reasons: Reason[] = [];
  if (!SAFE_METHODS.has(method)) {
    reasons.push({
      key: "method",
      text: `${method} isn't on the safelist (GET, HEAD, POST).`,
    });
  }
  if (
    (method === "POST" || method === "PUT") &&
    contentType === "application/json"
  ) {
    reasons.push({
      key: "ct",
      text: `Content-Type: application/json isn't safelisted — only text/plain, form-urlencoded, and multipart/form-data are.`,
    });
  }
  if (auth) {
    reasons.push({
      key: "auth",
      text: `The Authorization header isn't on the safelist — any request carrying one preflights.`,
    });
  }
  if (custom) {
    reasons.push({
      key: "custom",
      text: `Custom headers (X-*, anything non-standard) force a preflight.`,
    });
  }
  return { preflight: reasons.length > 0, reasons };
}

type Props = {
  initialMethod?: Method;
  initialContentType?: ContentType;
  initialAuth?: boolean;
  initialCustom?: boolean;
};

export function RequestClassifier({
  initialMethod = "GET",
  initialContentType = "text/plain",
  initialAuth = false,
  initialCustom = false,
}: Props) {
  const [method, setMethod] = useState<Method>(initialMethod);
  const [contentType, setContentType] = useState<ContentType>(initialContentType);
  const [auth, setAuth] = useState(initialAuth);
  const [custom, setCustom] = useState(initialCustom);
  const [touched, setTouched] = useState(false);
  const touch = () => setTouched(true);

  const verdict = useMemo(
    () => classify(method, contentType, auth, custom),
    [method, contentType, auth, custom],
  );

  const ctDisabled = method === "GET" || method === "DELETE";

  return (
    <WidgetShell
      title="preflight classifier · request shape decides"
      measurements={verdict.preflight ? "OPTIONS first" : "sends directly"}
      captionTone="prominent"
      caption={
        !touched
          ? "Toggle a method, a content-type, or a header. Watch the verdict — and the OPTIONS handshake when one fires."
          : verdict.preflight
            ? "OPTIONS goes first. If the server doesn't approve it, the real request never leaves your browser."
            : "Safelisted. The request goes straight out; only the response is gated."
      }
    >
      <div className="flex flex-col gap-[var(--spacing-md)]">
        {/* Controls */}
        <div className="grid gap-[var(--spacing-sm)]" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          <SegmentedRow
            label="method"
            options={METHODS}
            value={method}
            onChange={(v) => {
              touch();
              setMethod(v);
            }}
          />
          <SegmentedRow
            label="Content-Type"
            options={CONTENT_TYPES}
            value={contentType}
            onChange={(v) => {
              touch();
              setContentType(v);
            }}
            disabled={ctDisabled}
            disabledHint={ctDisabled ? "(no body on this method)" : undefined}
          />
          <div
            className="bs-classifier-row flex items-center gap-[var(--spacing-md)] flex-wrap font-sans"
            style={{ fontSize: "var(--text-ui)" }}
          >
            <span
              className="bs-classifier-label font-mono"
              style={{
                color: "var(--color-text-muted)",
                minWidth: "12ch",
              }}
            >
              extra headers
            </span>
            <div className="bs-classifier-options flex items-center gap-[var(--spacing-2xs)] flex-wrap">
              <Toggle
                label="Authorization"
                pressed={auth}
                onToggle={() => {
                  touch();
                  setAuth((v) => !v);
                }}
              />
              <Toggle
                label="X-Custom"
                pressed={custom}
                onToggle={() => {
                  touch();
                  setCustom((v) => !v);
                }}
              />
            </div>
          </div>
        </div>

        {/* Verdict pill + reasons */}
        <div
          className="rounded-[var(--radius-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)]"
          style={{
            background: verdict.preflight
              ? "color-mix(in oklab, var(--color-accent) 10%, transparent)"
              : "color-mix(in oklab, var(--color-surface) 60%, transparent)",
            border: `1px solid ${verdict.preflight ? "var(--color-accent)" : "var(--color-rule)"}`,
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: "var(--text-ui)",
              color: verdict.preflight ? "var(--color-accent)" : "var(--color-text)",
              fontWeight: 500,
            }}
            aria-live="polite"
          >
            {verdict.preflight
              ? "preflighted · OPTIONS sent first"
              : "simple request · no preflight"}
          </div>
          <AnimatePresence initial={false}>
            {verdict.reasons.length > 0 ? (
              <motion.ul
                className="mt-[var(--spacing-sm)] flex flex-col gap-[var(--spacing-2xs)] font-sans"
                style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.smooth}
              >
                {verdict.reasons.map((r) => (
                  <li key={r.key} className="flex gap-[var(--spacing-xs)]">
                    <span style={{ color: "var(--color-accent)" }} aria-hidden>
                      ·
                    </span>
                    <span>{r.text}</span>
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Preflight exchange reveal */}
        <AnimatePresence initial={false}>
          {verdict.preflight ? (
            <motion.div
              key="preflight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={SPRING.smooth}
              className="rounded-[var(--radius-sm)] px-[var(--spacing-md)] py-[var(--spacing-md)] font-mono"
              style={{
                background: "color-mix(in oklab, var(--color-surface) 40%, transparent)",
                border: "1px dashed var(--color-rule)",
                fontSize: "var(--text-small)",
                lineHeight: 1.7,
              }}
            >
              <div style={{ color: "var(--color-text-muted)" }}>
                <span className="sr-only">step 1 of 3: </span>
                <span aria-hidden>①</span> browser → server
              </div>
              <div>
                OPTIONS /me HTTP/1.1
                <br />
                Origin: https://app.example.com
                <br />
                Access-Control-Request-Method: {method}
                {(auth || custom || contentType === "application/json") && (
                  <>
                    <br />
                    Access-Control-Request-Headers:{" "}
                    {[
                      contentType === "application/json" ? "content-type" : null,
                      auth ? "authorization" : null,
                      custom ? "x-custom" : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </>
                )}
              </div>
              <div
                className="mt-[var(--spacing-sm)]"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="sr-only">step 2 of 3: </span>
                <span aria-hidden>②</span> server → browser
              </div>
              <div>
                HTTP/1.1 204 No Content
                <br />
                Access-Control-Allow-Origin: https://app.example.com
                <br />
                Access-Control-Allow-Methods: {method}
                {(auth || custom || contentType === "application/json") && (
                  <>
                    <br />
                    Access-Control-Allow-Headers:{" "}
                    {[
                      contentType === "application/json" ? "Content-Type" : null,
                      auth ? "Authorization" : null,
                      custom ? "X-Custom" : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </>
                )}
              </div>
              <div
                className="mt-[var(--spacing-sm)]"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="sr-only">step 3 of 3: </span>
                <span aria-hidden>③</span> real {method} request proceeds
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </WidgetShell>
  );
}

function SegmentedRow<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  disabledHint,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <div
      className="bs-classifier-row flex items-center gap-[var(--spacing-md)] flex-wrap font-sans"
      style={{ fontSize: "var(--text-ui)" }}
    >
      <span
        className="bs-classifier-label font-mono"
        style={{
          color: "var(--color-text-muted)",
          minWidth: "12ch",
        }}
      >
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className="bs-classifier-options flex items-center gap-[var(--spacing-2xs)] flex-wrap"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {options.map((opt) => {
          const active = opt === value;
          return (
            <motion.button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(opt)}
              className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center font-mono transition-colors hover:enabled:text-[color:var(--color-accent)] disabled:cursor-not-allowed"
              style={{
                fontSize: "var(--text-small)",
                color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                background: active
                  ? "color-mix(in oklab, var(--color-accent) 10%, transparent)"
                  : "transparent",
                border: `1px solid ${active ? "var(--color-accent)" : "var(--color-rule)"}`,
              }}
              {...PRESS}
            >
              {opt}
            </motion.button>
          );
        })}
        {disabled && disabledHint ? (
          <span
            className="font-sans"
            style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}
          >
            {disabledHint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Toggle({
  label,
  pressed,
  onToggle,
}: {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center font-mono transition-colors hover:text-[color:var(--color-accent)]"
      style={{
        fontSize: "var(--text-small)",
        color: pressed ? "var(--color-accent)" : "var(--color-text-muted)",
        background: pressed
          ? "color-mix(in oklab, var(--color-accent) 10%, transparent)"
          : "transparent",
        border: `1px solid ${pressed ? "var(--color-accent)" : "var(--color-rule)"}`,
      }}
      {...PRESS}
    >
      <span aria-hidden style={{ marginRight: 6 }}>
        {pressed ? "■" : "□"}
      </span>
      {label}
    </motion.button>
  );
}
