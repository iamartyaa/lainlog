"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { PRESS, SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";
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

type Reason = { text: string; key: string; tone?: "default" | "credentials" };

type Verdict = {
  preflight: boolean;
  /** True iff a cookie / credentialed request would itself be rejected
   *  (e.g. the server's `*` allow-origin is illegal once credentials ride). */
  credentialsBlock: boolean;
  reasons: Reason[];
};

function classify(
  method: Method,
  contentType: ContentType,
  auth: boolean,
  custom: boolean,
  credentials: boolean,
): Verdict {
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
  if (credentials) {
    reasons.push({
      key: "creds",
      tone: "credentials",
      text: `credentials: 'include' — the response must carry Access-Control-Allow-Credentials: true, and Allow-Origin can't be the wildcard *.`,
    });
  }
  return {
    preflight: reasons.some((r) => r.tone !== "credentials"),
    credentialsBlock: credentials,
    reasons,
  };
}

type Props = {
  initialMethod?: Method;
  initialContentType?: ContentType;
  initialAuth?: boolean;
  initialCustom?: boolean;
  initialCredentials?: boolean;
};

export function RequestClassifier({
  initialMethod = "GET",
  initialContentType = "text/plain",
  initialAuth = false,
  initialCustom = false,
  initialCredentials = false,
}: Props) {
  const [method, setMethod] = useState<Method>(initialMethod);
  const [contentType, setContentType] = useState<ContentType>(initialContentType);
  const [auth, setAuth] = useState(initialAuth);
  const [custom, setCustom] = useState(initialCustom);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [touched, setTouched] = useState(false);
  const touch = () => setTouched(true);

  const verdict = useMemo(
    () => classify(method, contentType, auth, custom, credentials),
    [method, contentType, auth, custom, credentials],
  );

  const ctDisabled = method === "GET" || method === "DELETE";

  const measurements = verdict.preflight
    ? credentials
      ? "OPTIONS first · creds gated"
      : "OPTIONS first"
    : credentials
      ? "sends directly · creds gated"
      : "sends directly";

  const caption = !touched
    ? "Watch the request shape decide. Toggle a method, a content-type, or a header — flip credentials to add the cookie constraint."
    : verdict.preflight
      ? credentials
        ? "OPTIONS goes first AND the response must opt into credentials. Either step failing keeps the body out of JS."
        : "OPTIONS goes first. If the server doesn't approve it, the real request never leaves your browser."
      : credentials
        ? "Sent directly — but cookies only ride if the response carries Allow-Credentials: true and a named origin (no wildcard)."
        : "Safelisted. The request goes straight out; only the response is gated.";

  return (
    <WidgetShell
      title="preflight classifier · request shape decides"
      measurements={measurements}
      captionTone="prominent"
      caption={caption}
    >
      {/* Fixed-frame grid: every row reserves its maximum height upfront so the
          container never resizes when verdict / reasons / preflight panel
          change. All transitions are color-, opacity-, or transform-only.
          R6 hard-rule compliance. */}
      <div
        className="grid"
        style={{
          gap: "var(--spacing-md)",
          gridTemplateRows: "auto auto auto",
        }}
      >
        {/* Row A — controls */}
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
              style={{ color: "var(--color-text-muted)", minWidth: "12ch" }}
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
          <div
            className="bs-classifier-row flex items-center gap-[var(--spacing-md)] flex-wrap font-sans"
            style={{ fontSize: "var(--text-ui)" }}
          >
            <span
              className="bs-classifier-label font-mono"
              style={{ color: "var(--color-text-muted)", minWidth: "12ch" }}
            >
              credentials
            </span>
            <div className="bs-classifier-options flex items-center gap-[var(--spacing-2xs)] flex-wrap">
              <CredentialsSwitch
                value={credentials}
                onChange={(v) => {
                  touch();
                  setCredentials(v);
                }}
              />
            </div>
          </div>
        </div>

        {/* Row B — verdict pill + reasons.
            Reserves space for up-to-five reasons so list growth is opacity-only. */}
        <div
          className="rounded-[var(--radius-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)]"
          style={{
            background: verdict.preflight
              ? "color-mix(in oklab, var(--color-accent) 10%, transparent)"
              : "color-mix(in oklab, var(--color-surface) 60%, transparent)",
            border: `1px solid ${verdict.preflight ? "var(--color-accent)" : "var(--color-rule)"}`,
            transition: "background 220ms ease, border-color 220ms ease",
            // Reserve enough vertical space for the verdict line + up to 5
            // reason lines so the frame never reflows. Calibrated to the worst
            // case (PUT + json + Authorization + X-Custom + credentials).
            minHeight: "11.5em",
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
          <ul
            className="mt-[var(--spacing-sm)] flex flex-col gap-[var(--spacing-2xs)] font-sans"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              listStyle: "none",
            }}
          >
            {verdict.reasons.map((r) => (
              <motion.li
                key={r.key}
                className="flex gap-[var(--spacing-xs)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.smooth}
                layout={false}
              >
                <span
                  style={{
                    color:
                      r.tone === "credentials"
                        ? "var(--color-accent)"
                        : "var(--color-accent)",
                  }}
                  aria-hidden
                >
                  {r.tone === "credentials" ? "▴" : "·"}
                </span>
                <span>{r.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Row C — fixed-height detail panel.
            Always rendered at the SAME height. Content swaps via opacity-only
            cross-fade so the frame can't shift. Three states:
              · default (no preflight, no creds): a quiet "no handshake" stub
              · preflight on, creds off: the OPTIONS↔200 handshake
              · creds on (with or without preflight): the same handshake but
                with Allow-Credentials lines added; if no preflight, the
                "what creds add to the response headers" annotation. */}
        <div
          className="relative rounded-[var(--radius-sm)] px-[var(--spacing-md)] py-[var(--spacing-md)] font-mono"
          style={{
            background: "color-mix(in oklab, var(--color-surface) 40%, transparent)",
            border: "1px dashed var(--color-rule)",
            fontSize: "var(--text-small)",
            lineHeight: 1.7,
            // Reserve enough space for the longest possible exchange (preflight
            // with both credentials + json + auth + x-custom). Pinned so
            // cross-fades don't reflow surrounding prose.
            minHeight: "16em",
          }}
        >
          <PreflightExchange
            method={method}
            auth={auth}
            custom={custom}
            credentials={credentials}
            contentType={contentType}
            preflight={verdict.preflight}
          />
        </div>
      </div>
    </WidgetShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

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
        style={{ color: "var(--color-text-muted)", minWidth: "12ch" }}
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
              onClick={() => {
                if (opt !== value) playSound("Toggle-On");
                onChange(opt);
              }}
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
      onClick={() => {
        // Toggle-On for both directions of the binary toggle (no Toggle-Off
        // — playbook chose a single sound to keep vocabulary tight).
        playSound("Toggle-On");
        onToggle();
      }}
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

/** Two-state switch: include / omit. Sized to match the segmented controls
 *  above so the row doesn't visually rebalance when toggled. */
function CredentialsSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const opts: { label: string; v: boolean }[] = [
    { label: "omit", v: false },
    { label: "include", v: true },
  ];
  return (
    <div role="radiogroup" aria-label="credentials" className="flex items-center gap-[var(--spacing-2xs)]">
      {opts.map((o) => {
        const active = o.v === value;
        return (
          <motion.button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (o.v !== value) playSound("Toggle-On");
              onChange(o.v);
            }}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center font-mono transition-colors hover:text-[color:var(--color-accent)]"
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
            {o.label}
          </motion.button>
        );
      })}
    </div>
  );
}

/** Renders the OPTIONS↔200 exchange when preflight fires; renders the cookies-
 *  ride-along annotation when only credentials are on; renders the quiet
 *  "no handshake" stub otherwise. All three swap inside the SAME fixed-height
 *  frame via opacity-only cross-fade. */
function PreflightExchange({
  method,
  auth,
  custom,
  credentials,
  contentType,
  preflight,
}: {
  method: Method;
  auth: boolean;
  custom: boolean;
  credentials: boolean;
  contentType: ContentType;
  preflight: boolean;
}) {
  const requestHeaders = [
    contentType === "application/json" ? "content-type" : null,
    auth ? "authorization" : null,
    custom ? "x-custom" : null,
  ].filter(Boolean) as string[];
  const responseHeaders = [
    contentType === "application/json" ? "Content-Type" : null,
    auth ? "Authorization" : null,
    custom ? "X-Custom" : null,
  ].filter(Boolean) as string[];

  // We render all three states on top of each other (absolutely positioned)
  // and animate opacity. This guarantees zero layout shift across states.
  const showPreflight = preflight;
  const showCredsOnly = !preflight && credentials;
  const showQuiet = !preflight && !credentials;

  return (
    <>
      {/* Preflight exchange */}
      <motion.div
        className="absolute inset-0 px-[var(--spacing-md)] py-[var(--spacing-md)]"
        initial={false}
        animate={{ opacity: showPreflight ? 1 : 0 }}
        transition={SPRING.smooth}
        style={{ pointerEvents: showPreflight ? "auto" : "none" }}
        aria-hidden={!showPreflight}
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
          {requestHeaders.length > 0 && (
            <>
              <br />
              Access-Control-Request-Headers: {requestHeaders.join(", ")}
            </>
          )}
        </div>
        <div className="mt-[var(--spacing-sm)]" style={{ color: "var(--color-text-muted)" }}>
          <span className="sr-only">step 2 of 3: </span>
          <span aria-hidden>②</span> server → browser
        </div>
        <div>
          HTTP/1.1 204 No Content
          <br />
          Access-Control-Allow-Origin:{" "}
          {credentials ? (
            <span style={{ color: "var(--color-accent)" }}>https://app.example.com</span>
          ) : (
            "https://app.example.com"
          )}
          <br />
          Access-Control-Allow-Methods: {method}
          {responseHeaders.length > 0 && (
            <>
              <br />
              Access-Control-Allow-Headers: {responseHeaders.join(", ")}
            </>
          )}
          {credentials && (
            <>
              <br />
              <span style={{ color: "var(--color-accent)" }}>
                Access-Control-Allow-Credentials: true
              </span>
            </>
          )}
        </div>
        <div className="mt-[var(--spacing-sm)]" style={{ color: "var(--color-text-muted)" }}>
          <span className="sr-only">step 3 of 3: </span>
          <span aria-hidden>③</span> real {method} request proceeds
          {credentials && (
            <span style={{ color: "var(--color-accent)" }}> · with cookies</span>
          )}
        </div>
      </motion.div>

      {/* Credentials-only annotation (no preflight, but cookies ride) */}
      <motion.div
        className="absolute inset-0 px-[var(--spacing-md)] py-[var(--spacing-md)]"
        initial={false}
        animate={{ opacity: showCredsOnly ? 1 : 0 }}
        transition={SPRING.smooth}
        style={{ pointerEvents: showCredsOnly ? "auto" : "none" }}
        aria-hidden={!showCredsOnly}
      >
        <div style={{ color: "var(--color-text-muted)" }}>
          <span aria-hidden>·</span> request goes directly with cookies attached
        </div>
        <div className="mt-[var(--spacing-sm)]">
          {method} /me HTTP/1.1
          <br />
          Origin: https://app.example.com
          <br />
          Cookie: session=abc123
        </div>
        <div className="mt-[var(--spacing-sm)]" style={{ color: "var(--color-text-muted)" }}>
          <span aria-hidden>·</span> response must carry, exactly:
        </div>
        <div>
          HTTP/1.1 200 OK
          <br />
          <span style={{ color: "var(--color-accent)" }}>
            Access-Control-Allow-Origin: https://app.example.com
          </span>
          <br />
          <span style={{ color: "var(--color-accent)" }}>
            Access-Control-Allow-Credentials: true
          </span>
        </div>
        <div
          className="mt-[var(--spacing-sm)] font-sans"
          style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)", lineHeight: 1.5 }}
        >
          Wildcard <code>*</code> origin is illegal once credentials ride. Both sides have to opt in by name.
        </div>
      </motion.div>

      {/* Quiet stub — no preflight, no credentials */}
      <motion.div
        className="absolute inset-0 px-[var(--spacing-md)] py-[var(--spacing-md)] flex items-center"
        initial={false}
        animate={{ opacity: showQuiet ? 1 : 0 }}
        transition={SPRING.smooth}
        style={{ pointerEvents: showQuiet ? "auto" : "none" }}
        aria-hidden={!showQuiet}
      >
          <div style={{ color: "var(--color-text-muted)" }}>
            <span aria-hidden>·</span> no handshake — request leaves directly. Only the response is gated.
            <br />
            <br />
            {method} /me HTTP/1.1
            <br />
            Origin: https://app.example.com
            {contentType !== "text/plain" && method !== "GET" && method !== "DELETE" && (
              <>
                <br />
                Content-Type: {contentType}
              </>
            )}
          </div>
      </motion.div>
    </>
  );
}
