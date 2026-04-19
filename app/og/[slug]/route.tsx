import { ImageResponse } from "next/og";
import { POSTS } from "@/content/posts-manifest";
import { SITE_NAME } from "@/lib/site";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

// OKLCH values resolved to RGB for the OG image (Satori supports limited CSS).
const BG = "#0e1114";
const TEXT = "#f8f5f0";
const MUTED = "#7a7570";
const ACCENT = "#d97341"; // terracotta

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { slug } = await ctx.params;
  const post = POSTS.find((p) => p.slug === slug);

  const title = post?.title ?? SITE_NAME;
  const hook =
    post?.hook ??
    "engineering essays with interactive widgets that show how the thing actually works.";
  const date = post?.date
    ? new Date(post.date + "T00:00:00Z")
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          timeZone: "UTC",
        })
        .toLowerCase()
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          color: TEXT,
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        {/* top row: wordmark + accent swatch */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.04em",
              color: MUTED,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              width: 16,
              height: 16,
              background: ACCENT,
            }}
          />
        </div>

        {/* title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: TEXT,
              maxWidth: 1020,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 28,
              lineHeight: 1.4,
              color: MUTED,
              fontFamily: "'IBM Plex Serif', serif",
              maxWidth: 900,
            }}
          >
            {hook}
          </div>
        </div>

        {/* bottom row: date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 20,
            fontFamily: "'IBM Plex Mono', monospace",
            color: MUTED,
          }}
        >
          {date ? <span>{date}</span> : <span>explainers · widgets · craft</span>}
        </div>
      </div>
    ),
    SIZE,
  );
}
