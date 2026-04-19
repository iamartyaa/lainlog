import type { MetadataRoute } from "next";
import { POSTS } from "@/content/posts-manifest";

const SITE = "https://bytesize.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const postRoutes: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${SITE}/posts/${p.slug}`,
    lastModified: new Date(p.date + "T00:00:00Z"),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes];
}
