"use client";

/**
 * UriTemplateBuilder — small scrubber for URI templates.
 *
 * Resources are URI-template-addressed. The reader edits two slot values
 * (`city`, `date`) and watches the concrete URI render below, alongside a
 * deterministic `resources/read` payload — a tiny weather card. The
 * template itself is fixed for the demonstration; the lesson is that slots
 * become parameters at request time.
 *
 * Implementation notes:
 * - Real <input type="text"> with aria-label per slot. The output region
 *   is aria-live="polite" so a screen reader hears the URI update.
 * - Datalist auto-suggest from a small fixed list — keeps the demo
 *   discoverable without imposing strict validation.
 * - Reduced motion: no transitions on the URI/output crossfade; values
 *   simply update.
 * - One accent only — terracotta only on the slot inputs' focus ring and
 *   the concrete URI's slot highlights.
 * - Frame-stable: the output card has fixed min-height so the figure
 *   doesn't grow when slots are filled.
 */

import { useId, useMemo, useState } from "react";
import { WidgetShell } from "@/components/viz/WidgetShell";

const TEMPLATE = "weather://forecast/{city}/{date}";

const CITY_SUGGESTIONS = ["tokyo", "paris", "seoul", "lisbon", "sf"];
const DATE_SUGGESTIONS = [
  "2026-05-12",
  "2026-06-01",
  "2026-07-04",
  "today",
];

/** Deterministic stub — the lesson is the URI shape, not a real fetch. */
function stubRead(city: string, date: string) {
  if (!city || !date) return null;
  // Tiny, fake, deterministic. Same city + date always returns the same line.
  const seed = (city.length * 31 + date.length * 7) % 4;
  const conditions = ["clear", "overcast", "rain", "scattered showers"];
  const lo = 11 + (city.length % 8);
  const hi = lo + 6 + (date.length % 4);
  return {
    city,
    date,
    conditions: conditions[seed],
    lo,
    hi,
  };
}

export function UriTemplateBuilder() {
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const cityListId = useId();
  const dateListId = useId();

  const concreteUri = useMemo(() => {
    return TEMPLATE.replace("{city}", city || "{city}").replace(
      "{date}",
      date || "{date}",
    );
  }, [city, date]);

  const filled = city.length > 0 && date.length > 0;
  const reading = useMemo(
    () => (filled ? stubRead(city, date) : null),
    [filled, city, date],
  );

  return (
    <WidgetShell
      title="Read a URI template"
      caption={
        <>
          Resources advertise themselves as templates with named slots. The
          host substitutes values at request time and calls{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>resources/read</code>{" "}
          on the concrete URI.
        </>
      }
    >
      <style>{`
        .bs-utb {
          container-type: inline-size;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .bs-utb-template {
          font-family: var(--font-mono);
          font-size: var(--text-body);
          line-height: 1.4;
          color: var(--color-text);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-surface);
          border-radius: var(--radius-sm);
          word-break: break-all;
        }
        .bs-utb-slot {
          color: var(--color-accent);
          font-weight: 600;
        }
        .bs-utb-slot[data-filled="true"] {
          color: var(--color-text);
          background: color-mix(in oklab, var(--color-accent) 18%, transparent);
          padding: 0 4px;
          border-radius: 3px;
        }
        .bs-utb-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-sm);
        }
        @container (min-width: 480px) {
          .bs-utb-fields {
            grid-template-columns: 1fr 1fr;
          }
        }
        .bs-utb-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bs-utb-label {
          font-family: var(--font-sans);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          letter-spacing: 0.02em;
        }
        .bs-utb-input {
          font-family: var(--font-mono);
          font-size: var(--text-body);
          padding: 10px 12px;
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          color: var(--color-text);
          min-height: 44px;
        }
        .bs-utb-input:focus {
          outline: 2px solid var(--color-accent);
          outline-offset: 1px;
          border-color: var(--color-accent);
        }
        .bs-utb-output {
          padding: var(--spacing-md);
          background: color-mix(in oklab, var(--color-surface) 40%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: var(--text-small);
          line-height: 1.55;
          color: var(--color-text);
          min-height: 110px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bs-utb-output-empty {
          color: var(--color-text-muted);
          font-style: italic;
          font-family: var(--font-serif);
        }
        .bs-utb-output-head {
          font-family: var(--font-sans);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          letter-spacing: 0.02em;
          text-transform: lowercase;
        }
        .bs-utb-output-line { font-family: var(--font-mono); font-size: 0.92em; }
        .bs-utb-output-key { color: var(--color-text-muted); }
      `}</style>

      <div className="bs-utb">
        <div>
          <div className="bs-utb-label" style={{ marginBottom: 4 }}>
            template
          </div>
          <div className="bs-utb-template" aria-label="URI template">
            weather://forecast/
            <span className="bs-utb-slot" data-filled={city ? "true" : "false"}>
              {city || "{city}"}
            </span>
            /
            <span className="bs-utb-slot" data-filled={date ? "true" : "false"}>
              {date || "{date}"}
            </span>
          </div>
        </div>

        <div className="bs-utb-fields">
          <label className="bs-utb-field">
            <span className="bs-utb-label">city</span>
            <input
              className="bs-utb-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value.trim().toLowerCase())}
              list={cityListId}
              aria-label="city slot value"
              placeholder="tokyo"
              autoComplete="off"
              spellCheck={false}
            />
            <datalist id={cityListId}>
              {CITY_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="bs-utb-field">
            <span className="bs-utb-label">date</span>
            <input
              className="bs-utb-input"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value.trim())}
              list={dateListId}
              aria-label="date slot value"
              placeholder="2026-05-12"
              autoComplete="off"
              spellCheck={false}
            />
            <datalist id={dateListId}>
              {DATE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>

        <div>
          <div className="bs-utb-label" style={{ marginBottom: 4 }}>
            concrete URI (what the host sends)
          </div>
          <div
            className="bs-utb-template"
            aria-live="polite"
            aria-label="concrete URI"
          >
            {concreteUri}
          </div>
        </div>

        <div className="bs-utb-output" aria-live="polite" aria-label="resources/read response">
          {!filled ? (
            <span className="bs-utb-output-empty">
              fill both slots to read the resource
            </span>
          ) : reading ? (
            <>
              <span className="bs-utb-output-head">resources/read response</span>
              <span className="bs-utb-output-line">
                <span className="bs-utb-output-key">city: </span>
                {reading.city}
              </span>
              <span className="bs-utb-output-line">
                <span className="bs-utb-output-key">date: </span>
                {reading.date}
              </span>
              <span className="bs-utb-output-line">
                <span className="bs-utb-output-key">conditions: </span>
                {reading.conditions}
              </span>
              <span className="bs-utb-output-line">
                <span className="bs-utb-output-key">temp: </span>
                {reading.lo}–{reading.hi}°C
              </span>
            </>
          ) : null}
        </div>
      </div>
    </WidgetShell>
  );
}

export default UriTemplateBuilder;
