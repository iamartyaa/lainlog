# Mobile-first verification playbook

Terminal-phase checks for the mobile-first rewrite (#7). Everything here is
runnable locally against `npm run dev` or a Vercel preview — no CI setup
required. Items marked **manual** need a real device or a human eye and are
explicitly handed to the reviewer.

---

## 1. Horizontal overflow

**Target**: `document.documentElement.scrollWidth === window.innerWidth` at
320 / 360 / 412 / 768 / 1024 on the home page and every post page.

Paste in DevTools Console at each width:

```js
({
  sw: document.documentElement.scrollWidth,
  iw: window.innerWidth,
  ok: document.documentElement.scrollWidth <= window.innerWidth,
  offenders: [...document.querySelectorAll("*")]
    .filter((el) => el.scrollWidth > window.innerWidth)
    .map((el) => ({ tag: el.tagName, id: el.id, cls: el.className?.toString?.().slice(0, 60) }))
    .slice(0, 5),
});
```

**Known intentional exception**: `OriginMatrix` on
`/posts/why-fetch-fails-only-in-browser` scrolls horizontally inside its
`<HScroll>` wrapper — that's the editorial decision (`✗` column alignment
is the teaching), not an overflow bug.

Dense SVG widgets (`FlowDemo`, `NormalisationMap`, `HashLane`) also get an
opt-in narrow-scroll wrapper (`.bs-widget-scroll-at-narrow`) that kicks in
only below `@container widget (max-width: 560px)` so labels stay readable.
The scroll is internal to the widget canvas; the page itself still passes
the overflow check.

---

## 2. Manual device matrix  *(reviewer)*

Each device runs the **full interaction pass**: click every PostList row,
step through every widget, toggle theme twice, enable OS reduce-motion and
re-walk the same flow.

| Device                       | Spec           | Check |
| ---------------------------- | -------------- | ----- |
| iPhone 13 mini               | 375 × 812, iOS 18 Safari |  |
| iPhone 14 Pro Max            | 430 × 932, iOS 18 Safari |  |
| Pixel 7                      | 412 × 915, Chrome Android |  |
| Galaxy S23                   | 360 × 780, Chrome Android |  |
| iPad portrait / landscape    | 810 / 1180, Safari       |  |
| MacBook Safari               | 1280 / 1920              |  |

**Pass criteria**: no horizontal overflow, no stuck hover after tap-release
on PostList rows or prose links, ring-pulse visible on Stepper prev/next,
address bar doesn't flash a white background on first paint, slider thumb
draggable with a thumb finger (44 × 44 hit target).

---

## 3. Keyboard a11y regression  *(static audit — done; reviewer walkthrough pending)*

Static audit against the committed code. Every interactive element below
is a real `<button>`, `<a>`, or native `<input type="range">`; no
`<div onClick>` anywhere; the global focus ring in `globals.css:focus-visible`
covers every consumer.

### Tab order on the home page

1. Header → `bytesize` wordmark (`<MotionLink href="/">`)
2. Header → theme toggle (`<motion.button>`)
3. PostList → each row (`<MotionLink>`) in document order

### Tab order inside a widget

1. `Stepper` prev button
2. `Stepper` play / pause button
3. `Stepper` next button
4. Widget-specific controls (scrubber, allow-origin toggle, scenario pills,
   segmented rows, etc.)
5. `<HScroll>` scroll region (tab-focusable, arrow keys scroll)

### Keyboard shortcuts

- `←` / `→` while focused on a Stepper button: prev / next (Stepper
  handlers consume the arrow keys; reduced-motion users still step).
- `Space` / `Enter` on any `<button>`: activate. On `<MotionLink>`: activate.
- `Tab` / `Shift+Tab`: move forward / backward through the above order.

### Known items

- **`OriginMatrix` rows** use `tabIndex={0}` so each row is independently
  focusable — matches the hover behavior for keyboard users.
- **`HScroll`** (`components/viz/HScroll.tsx`) uses `tabIndex={0}` on the
  scroll container so the region is reachable; arrow keys scroll natively.

**Reviewer walkthrough**: tab through a live home page and a live post
page; confirm (a) every item in the lists above is reachable, (b) the
2 px terracotta focus ring is visible on every stop, (c) no keyboard trap
inside `HScroll` or any widget.

---

## 4. Lighthouse CI  *(reviewer runs)*

No CI config committed — keeps dev deps lean. Run ad-hoc against a Vercel
preview:

```bash
npx -y @lhci/cli@0.13.x autorun \
  --collect.url=https://<preview-url>/ \
  --collect.url=https://<preview-url>/posts/how-gmail-knows-your-email-is-taken \
  --collect.url=https://<preview-url>/posts/why-fetch-fails-only-in-browser \
  --collect.url=https://<preview-url>/posts/the-function-that-remembered \
  --collect.settings.preset=mobile \
  --assert.preset=lighthouse:recommended \
  --assert.assertions.categories:performance=off \
  --assert.assertions.categories:accessibility=off
```

**Pass bars** (from #7): Performance ≥ 95 home / ≥ 93 posts, Accessibility
= 100, Best Practices = 100.

---

## 5. axe-core smoke  *(reviewer runs)*

Quickest path without installing Playwright into this repo: use the
axe DevTools browser extension on a Vercel preview. Load each of the four
URLs, click "Scan", expect **zero critical violations**.

If you want a scripted check later, the scaffold is:

```bash
# in a scratch repo or throwaway install — not committed here
npm i -D @playwright/test @axe-core/playwright
```

```ts
// tests/a11y.spec.ts (example, not committed)
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URLS = [
  "/",
  "/posts/how-gmail-knows-your-email-is-taken",
  "/posts/why-fetch-fails-only-in-browser",
  "/posts/the-function-that-remembered",
];

for (const url of URLS) {
  test(`axe critical violations on ${url}`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
}
```

---

## 6. Throttled performance  *(reviewer)*

Chrome DevTools → Performance → emulation: **Slow 3G** network + **4×** CPU.
Hard-reload each URL, read FCP / LCP / TTI from the `Web Vitals` overlay.

**Pass bars**: FCP < 2 s, LCP < 2.5 s, TTI < 4 s.

Watch for LCP regressions on the home page — the wordmark is the LCP
candidate and is deliberately **transform-only** on first-visit hero so
the pixel paints before the animation settles.

---

## 7. Reduced motion

In macOS: System Settings → Accessibility → Display → Reduce motion → on.
Reload each URL.

- Every reveal / view-transition / theme-morph / ornament-draw /
  first-visit-hero animation must collapse to ≤ 1 ms.
- Final state still correct: widgets interactive, dots visible, layout
  settled.
- State changes (copy button → "copied", scenario pill toggles, scrubber
  readouts) must still occur — reduced motion removes the animation, not
  the state.

---

## 8. Font payload

DevTools → Network → filter `font`. Hard-reload the home page.

**Expected**: 11 font requests total, all `display: swap`:

- Plex Serif normal × 3 (400, 500, 600)
- Plex Serif italic × 3 (400, 500, 600)
- Plex Sans × 3 (400, 500, 600)
- Plex Mono × 2 (400, 500)

Down from 14 pre-phase-5 (weight 700 was unused).

---

## 9. Theme flash

1. Set OS theme to dark. Hard-reload `/`. Page must paint **dark** — no
   white flash before CSS kicks in. The `themeColor` / `colorScheme`
   hints in `app/layout.tsx:viewport` prime the browser shell.
2. Set OS theme to light. Hard-reload. Page must paint **light**.
3. Toggle theme via the header button on a post page with widgets and
   code visible: colors crossfade over 240 ms, the terracotta accent
   visibly desaturates through `--color-text-muted` mid-transition and
   re-saturates at the new theme.
