import { ImageResponse } from "next/og";
import { POSTS } from "@/content/posts-manifest";
import { SITE_NAME } from "@/lib/site";
import { STATIC_COVERS } from "@/components/covers/static-registry";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

// OKLCH design tokens resolved to hex for the OG image (Satori has limited
// CSS-variable support). Mirror this set in static cover exports — keep them
// in sync with components/covers/static-registry.ts.
const BG = "#0e1114";
const TEXT = "#f8f5f0";
const MUTED = "#7a7570";
const ACCENT = "#d97341";

type RouteContext = { params: Promise<{ slug: string }> };

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00Z")
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    })
    .toLowerCase();
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { slug } = await ctx.params;
  const post = POSTS.find((p) => p.slug === slug);
  const StaticCover = STATIC_COVERS[slug];

  // Composed two-up tile (cover left, copy right) for known posts.
  if (StaticCover && post) {
    const date = formatDate(post.date);
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
            padding: "60px",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          {/* Top row: wordmark + accent swatch */}
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
            <div style={{ width: 16, height: 16, background: ACCENT }} />
          </div>

          {/* Two-up body: cover (left) + copy (right) */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              gap: 60,
              marginTop: 24,
              marginBottom: 24,
            }}
          >
            {/* Cover art — fills the left half */}
            <div
              style={{
                display: "flex",
                width: 480,
                height: 480,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <StaticCover />
            </div>

            {/* Copy column — title + hook */}
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
                  fontSize: 56,
                  fontWeight: 600,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: TEXT,
                  // Clamp at 3 lines via overflow + max height roughly = 3*56*1.15
                  display: "flex",
                }}
              >
                {post.title}
              </div>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 24,
                  lineHeight: 1.4,
                  color: MUTED,
                  fontFamily: "'IBM Plex Serif', serif",
                  display: "flex",
                }}
              >
                {post.hook}
              </div>
            </div>
          </div>

          {/* Bottom row: date pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 18,
              fontFamily: "'IBM Plex Mono', monospace",
              color: ACCENT,
            }}
          >
            {date ? (
              <span>{date}</span>
            ) : (
              <span>explainers · widgets · craft</span>
            )}
          </div>
        </div>
      ),
      SIZE,
    );
  }

  // Fallback: typographic-only design for unknown slugs (_default, /about, etc).
  const title = post?.title ?? SITE_NAME;
  const hook =
    post?.hook ??
    "engineering essays with interactive widgets that show how the thing actually works.";
  const date = formatDate(post?.date);

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
          <div style={{ width: 16, height: 16, background: ACCENT }} />
        </div>

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
