import type { MetadataRoute } from "next";

const BASE = "https://checked.co.in";

/**
 * Only the homepage and The Tower carry crawlable content. The other four
 * routes are personalized, client-rendered app shells (they render empty to a
 * crawler until a user builds local state), so we keep them out of the index —
 * both here and via `robots: { index: false }` in each route's layout.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/check-in", "/manifest", "/weigh-in", "/debrief"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
