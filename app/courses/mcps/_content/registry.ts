/**
 * Per-chapter content registry for the MCPs course.
 *
 * Each authored chapter exports a default `Content` component from
 * `app/courses/mcps/_content/<chapter-slug>/Content.tsx`. The dynamic
 * chapter route (`app/courses/[courseSlug]/[chapterSlug]/page.tsx`) looks
 * the slug up here; if a Content module is registered, it renders that
 * component instead of the placeholder paragraph. If not, it falls back
 * to the placeholder so unauthored chapters still ship as shell pages.
 *
 * Adding a chapter:
 *   1. Build `app/courses/mcps/_content/<slug>/Content.tsx` (default export).
 *   2. Add a row to `MCPS_CONTENT` below.
 *   3. The route picks it up automatically.
 */

import type { ComponentType } from "react";
import HostClientServerContent from "./host-client-server/Content";
import JsonRpcTheWireContent from "./json-rpc-the-wire/Content";
import TheHandshakeContent from "./the-handshake/Content";

export const MCPS_CONTENT: Record<string, ComponentType> = {
  "host-client-server": HostClientServerContent,
  "json-rpc-the-wire": JsonRpcTheWireContent,
  "the-handshake": TheHandshakeContent,
};
