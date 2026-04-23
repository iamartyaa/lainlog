# bytesize

A blog of long-form engineering essays on software and AI, each paired with interactive widgets embedded in the post.

**Live at [bytesize.vercel.app](https://bytesize.vercel.app).**

## Posts

- [**The function that remembered**](https://bytesize.vercel.app/posts/the-function-that-remembered) — how a function outlives the scope it was born in.
- [**The browser stopped asking**](https://bytesize.vercel.app/posts/the-browser-stopped-asking) — real-time apps didn't teach the server to speak first; they taught the browser to stop hanging up.
- [**Why `fetch` works in curl but the browser blocks it**](https://bytesize.vercel.app/posts/why-fetch-fails-only-in-browser) — the server answered; your browser is holding the response back from your JavaScript.
- [**How Gmail knows your email is taken, instantly**](https://bytesize.vercel.app/posts/how-gmail-knows-your-email-is-taken) — the pipeline behind "already taken" before your finger lifts.

Subscribe via [RSS](https://bytesize.vercel.app/rss.xml).

## Features

- Bespoke **interactive widgets** in every post — run, step, adjust.
- **Dark and light themes** (auto-follows OS; togglable).
- **Mobile-first** layout with fluid type and responsive widgets.
- Server-rendered **Open Graph** covers per post.
- Unique-**reader counter** on the homepage, rendered as a dot-matrix glyph.
- **RSS** feed at `/rss.xml`, sitemap at `/sitemap.xml`.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) · React 19 · TypeScript strict
- Tailwind CSS v4 (CSS-first `@theme`)
- [motion](https://motion.dev)
- [Shiki](https://shiki.matsu.io) + shiki-magic-move for syntax-highlighted code
- IBM Plex Serif + Sans + Mono, via `next/font`
- [GoatCounter](https://www.goatcounter.com) for privacy-respecting analytics
- Deployed on Vercel

## Running locally

```bash
pnpm install
pnpm dev
```

### Optional env vars (`.env.local`)

- `GOATCOUNTER_API_TOKEN` — when set, the homepage fetches the live reader count.
- `READER_COUNT_MOCK` — override the reader count in dev (e.g. `READER_COUNT_MOCK=12483`) without hitting the API.

## Project layout

```
app/          Next.js App Router routes (home, posts, RSS, sitemap, OG images)
components/   Reusable UI — nav, prose, motion, widget shells, code blocks
content/      Post manifest (titles, slugs, dates, hooks)
lib/          Hooks, utilities, site config, analytics
```

## Design

See [`DESIGN.md`](./DESIGN.md) — the single source of truth for tokens, palette, typography, and motion.

## Author

Built by An Anonymous Engineer.
