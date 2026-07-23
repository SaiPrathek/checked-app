import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";

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
    {
      url: `${BASE}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...GUIDES.map((g) => ({
      url: `${BASE}/guides/${g.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${BASE}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/disclosure`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
