"use client";

import { trackEvent } from "@/lib/track";

/**
 * "Buy in the US" affiliate CTA. Rendered only for buy-in-us verdicts that have
 * a buyUrl. rel="sponsored nofollow" per FTC/SEO norms; logs an affiliate_click
 * event (fire-and-forget). The link is program-agnostic — a plain product/search
 * URL works today; append the affiliate tag once the program is live.
 */
export function BuyCta({
  url,
  item,
  label,
}: {
  url: string;
  item: string;
  label?: string | null;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="sponsored nofollow noopener"
      onClick={() => trackEvent("affiliate_click", { item })}
      className="inline-flex items-center gap-1 rounded-full border border-[#bdd6f5] bg-[#e7f0fb] px-3 py-1 text-[12px] font-semibold text-[#1257b8] transition-colors hover:bg-[#d8e7fa]"
    >
      {label || "Buy in the US"} <span aria-hidden>→</span>
    </a>
  );
}
