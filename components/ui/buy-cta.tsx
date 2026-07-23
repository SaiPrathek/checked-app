"use client";

import { trackEvent } from "@/lib/track";
import type { Verdict } from "@/lib/types";

/**
 * Affiliate CTA on an item we already recommend a verdict for — "Buy in India"
 * for bring-from-india items (Amazon India, buy before you fly), "Buy in the US"
 * for buy-in-us items (Amazon US, buy after you land). It only helps the user
 * act on the verdict we independently reached; it never influences that verdict.
 * rel="sponsored nofollow" per FTC/SEO norms; logs a fire-and-forget click.
 * Program-agnostic — a plain search URL works today; append the affiliate tag
 * once the program is live.
 */
export function BuyCta({
  url,
  item,
  label,
  verdict,
}: {
  url: string;
  item: string;
  label?: string | null;
  verdict?: Verdict;
}) {
  const fallback = verdict === "bring-from-india" ? "Buy in India" : "Buy in the US";
  return (
    <a
      href={url}
      target="_blank"
      rel="sponsored nofollow noopener"
      onClick={() => trackEvent("affiliate_click", { item, verdict })}
      className="inline-flex items-center gap-1 rounded-full border border-[#bdd6f5] bg-[#e7f0fb] px-3 py-1 text-[12px] font-semibold text-[#1257b8] transition-colors hover:bg-[#d8e7fa]"
    >
      {label || fallback} <span aria-hidden>→</span>
    </a>
  );
}
