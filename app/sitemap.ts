import type { MetadataRoute } from "next";

const BASE = "https://checked.co.in";

/**
 * Only the indexable routes belong here (home + The Tower). The interactive
 * tool pages are noindex, so listing them would send mixed signals.
 * `lastModified` is stamped at build time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/the-tower`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
