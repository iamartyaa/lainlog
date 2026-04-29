import type { MetadataRoute } from "next";
import { POSTS } from "@/content/posts-manifest";
import { COURSES } from "@/content/courses-manifest";
import { SITE_URL as SITE } from "@/lib/site";

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

  const courseRoutes: MetadataRoute.Sitemap = COURSES.flatMap((c) => {
    const updated = c.updatedAt
      ? new Date(c.updatedAt + "T00:00:00Z")
      : new Date();
    return [
      {
        url: `${SITE}/courses/${c.slug}`,
        lastModified: updated,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      },
      ...c.chapters.map((ch) => ({
        url: `${SITE}/courses/${c.slug}/${ch.slug}`,
        lastModified: updated,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  });

  return [...staticRoutes, ...postRoutes, ...courseRoutes];
}
