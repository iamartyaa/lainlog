"use client";

/**
 * ElicitationForm — render a small form from a JSON Schema fragment.
 *
 * Pedagogical role: an `elicitation/create` request carries a JSON-Schema
 * subset; the host renders that schema as a form, the user fills it, and
 * the form data goes back to the server as the response. The user IS the
 * response — there's only one HITL gate, because the gate is the answer.
 *
 * Two roles in the chapter:
 *   - Standalone (Content.tsx, around the elicitation beat) — the reader
 *     sees a default schema, fills the form, watches the response payload
 *     update live.
 *   - Embedded inside ReverseFlowDiagram's "elicitation" tab (compact mode)
 *     at the user-fills tick.
 *
 * The schema is intentionally small (two fields: name + email) and held
 * static — `ElicitationSchemaBuilder` is out of scope for this build; the
 * component teaches "schema → form → response payload" without dragging.
 */

import { useState, useId, useMemo } from "react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { playSound } from "@/lib/audio";

type Field = {
  key: string;
  label: string;
  type: "string" | "email" | "enum";
  required: boolean;
  options?: string[];
  placeholder?: string;
};

const SCHEMA: Field[] = [
  {
    key: "name",
    label: "your name",
    type: "string",
    required: true,
    placeholder: "Ada Lovelace",
  },
  {
    key: "email",
    label: "email for the booking confirmation",
    type: "email",
    required: true,
    placeholder: "ada@example.com",
  },
  {
    key: "seatPreference",
    label: "seat preference",
    type: "enum",
    required: false,
    options: ["aisle", "window", "middle"],
  },
];

const SCHEMA_JSON = `{
  "method": "elicitation/create",
  "params": {
    "message": "We need a few details to confirm.",
    "requestedSchema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "seatPreference": {
          "type": "string",
          "enum": ["aisle", "window", "middle"]
        }
      },
      "required": ["name", "email"]
    }
  }
}`;

type ElicitationFormProps = {
  /** Compact = no WidgetShell, render only the form (used inside the flow
   *  diagram). Default false. */
  compact?: boolean;
  /** Optional callback fired when the form is submitted. Lets the parent
   *  diagram advance its tick once the user has answered. */
  onSubmit?: (response: Record<string, string>) => void;
};

export function ElicitationForm({
  compact = false,
  onSubmit,
}: ElicitationFormProps) {
  const formId = useId();
  const [values, setValues] = useState<Record<string, string>>({
    name: "",
    email: "",
    seatPreference: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const setField = (k: string, v: string) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  // The "live" response payload reflects whatever the user has typed so far.
  const responsePayload = useMemo(() => {
    const filtered: Record<string, string> = {};
    for (const f of SCHEMA) {
      if (values[f.key]) filtered[f.key] = values[f.key];
    }
    return JSON.stringify(
      {
        action: submitted ? "accept" : "draft",
        content: filtered,
      },
      null,
      2,
    );
  }, [values, submitted]);

  const canSubmit =
    SCHEMA.filter((f) => f.required).every((f) => values[f.key].trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    playSound("Success");
    setSubmitted(true);
    onSubmit?.(values);
  };

  const handleReset = () => {
    playSound("Progress-Tick");
    setValues({ name: "", email: "", seatPreference: "" });
    setSubmitted(false);
  };

  const form = (
    <div className="bs-elic-grid">
      <form
        id={formId}
        className="bs-elic-form"
        onSubmit={handleSubmit}
        aria-label="Elicitation form rendered from server schema"
      >
        <div className="bs-elic-eyebrow">
          <span>filesystem-server is asking</span>
          <span className="bs-elic-pill">elicitation/create</span>
        </div>
        <p className="bs-elic-message">
          We need a few details to confirm.
        </p>
        {SCHEMA.map((f) => (
          <div key={f.key} className="bs-elic-field">
            <label htmlFor={`${formId}-${f.key}`} className="bs-elic-label">
              {f.label}
              {f.required ? (
                <span className="bs-elic-required" aria-label="required">
                  *
                </span>
              ) : (
                <span className="bs-elic-optional"> (optional)</span>
              )}
            </label>
            {f.type === "enum" ? (
              <select
                id={`${formId}-${f.key}`}
                className="bs-elic-input"
                value={values[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
                disabled={submitted}
              >
                <option value="">— pick one —</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`${formId}-${f.key}`}
                type={f.type === "email" ? "email" : "text"}
                className="bs-elic-input"
                value={values[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                disabled={submitted}
              />
            )}
          </div>
        ))}
        <div className="bs-elic-actions">
          {submitted ? (
            <button
              type="button"
              className="bs-elic-btn bs-elic-btn--reset"
              onClick={handleReset}
            >
              reset
            </button>
          ) : (
            <button
              type="submit"
              className="bs-elic-btn bs-elic-btn--primary"
              disabled={!canSubmit}
            >
              send →
            </button>
          )}
        </div>
      </form>
      <div className="bs-elic-side">
        <div className="bs-elic-side-block">
          <div className="bs-elic-side-head">schema (server → client)</div>
          <pre className="bs-elic-json">{SCHEMA_JSON}</pre>
        </div>
        <div className="bs-elic-side-block">
          <div className="bs-elic-side-head">
            response (client → server){" "}
            <span className="bs-elic-side-tag" data-state={submitted ? "sent" : "draft"}>
              {submitted ? "sent" : "draft"}
            </span>
          </div>
          <pre className="bs-elic-json">{responsePayload}</pre>
        </div>
      </div>
    </div>
  );

  const styles = (
    <style>{`
      .bs-elic-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
      @container widget (min-width: 640px) {
        .bs-elic-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      .bs-elic-form {
        background: var(--color-surface);
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }
      .bs-elic-eyebrow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-sm);
        font-family: var(--font-sans);
        font-size: var(--text-ui);
        color: var(--color-text);
      }
      .bs-elic-pill {
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--color-accent);
        color: var(--color-accent);
        background: color-mix(in oklab, var(--color-accent) 8%, transparent);
        white-space: nowrap;
      }
      .bs-elic-message {
        font-family: var(--font-serif);
        font-size: var(--text-body);
        color: var(--color-text);
        margin: 0;
        line-height: 1.5;
      }
      .bs-elic-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .bs-elic-label {
        font-family: var(--font-sans);
        font-size: var(--text-small);
        color: var(--color-text-muted);
      }
      .bs-elic-required {
        color: var(--color-accent);
        margin-left: 4px;
      }
      .bs-elic-optional {
        color: var(--color-text-muted);
        opacity: 0.7;
      }
      .bs-elic-input {
        min-height: 44px;
        padding: 8px 10px;
        font-family: var(--font-mono);
        font-size: var(--text-body);
        background: var(--color-bg);
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-sm);
        color: var(--color-text);
      }
      .bs-elic-input:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 1px;
        border-color: var(--color-accent);
      }
      .bs-elic-input:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .bs-elic-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
      }
      .bs-elic-btn {
        min-height: 44px;
        padding: 8px 16px;
        font-family: var(--font-sans);
        font-size: var(--text-ui);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-rule);
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
      }
      .bs-elic-btn:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .bs-elic-btn--primary {
        border-color: var(--color-accent);
        color: var(--color-accent);
        background: color-mix(in oklab, var(--color-accent) 12%, transparent);
      }
      .bs-elic-btn--primary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .bs-elic-side {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }
      .bs-elic-side-block {
        background: var(--color-surface);
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-md);
        overflow: hidden;
      }
      .bs-elic-side-head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px var(--spacing-sm);
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--color-text-muted);
        text-transform: lowercase;
        letter-spacing: 0.02em;
        border-bottom: 1px solid var(--color-rule);
      }
      .bs-elic-side-tag {
        font-family: var(--font-mono);
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 999px;
        border: 1px solid var(--color-rule);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .bs-elic-side-tag[data-state="sent"] {
        border-color: var(--color-accent);
        color: var(--color-accent);
        background: color-mix(in oklab, var(--color-accent) 8%, transparent);
      }
      .bs-elic-json {
        font-family: var(--font-mono);
        font-size: 11.5px;
        line-height: 1.5;
        color: var(--color-text);
        margin: 0;
        padding: var(--spacing-sm);
        white-space: pre;
        overflow-x: auto;
        max-height: 280px;
        overflow-y: auto;
      }
    `}</style>
  );

  if (compact) {
    return (
      <>
        {styles}
        {form}
      </>
    );
  }

  return (
    <WidgetShell
      title="Elicitation — schema in, form out, response payload back"
      caption={
        <>
          The server sent a JSON-Schema fragment; the host renders it as a
          form. Fill it (the user is the response) and watch the payload that
          goes back compose, field by field.
        </>
      }
    >
      {styles}
      {form}
    </WidgetShell>
  );
}

export default ElicitationForm;
