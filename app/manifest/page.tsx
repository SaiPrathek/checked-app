"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useApp } from "@/lib/store";
import { PACKING_ITEMS } from "@/lib/packing-items";
import { getHoldItem } from "@/lib/hold";
import { resolveGuidance } from "@/lib/guidance";
import type { Category, PackingItem } from "@/lib/types";
import { VerdictBadge } from "@/components/ui/verdict-badge";
import { CommunityStat } from "@/components/ui/community-stat";
import { getCommunityStats } from "@/lib/actions/debrief";
import type { Stat } from "@/lib/debrief";

const CATEGORY_ORDER: Category[] = [
  "documents",
  "medicines",
  "clothing",
  "kitchen",
  "food",
  "electronics",
  "bedding",
  "toiletries",
  "money",
];

const CATEGORY_LABEL: Record<Category, string> = {
  documents: "Documents",
  medicines: "Medicines & health",
  clothing: "Clothing",
  kitchen: "Kitchen",
  food: "Food",
  electronics: "Electronics",
  bedding: "Bedding",
  toiletries: "Toiletries & supplies",
  money: "Money",
};

export default function Manifest() {
  const { profile, list, toggleListItem, isListed, hydrated } = useApp();
  const { isSignedIn } = useUser();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stats, setStats] = useState<Map<string, Stat>>(new Map());

  const grouped = useMemo(() => {
    const map = new Map<Category, PackingItem[]>();
    for (const it of PACKING_ITEMS) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return map;
  }, []);

  // Community stats are public — fetch for every visitor.
  useEffect(() => {
    getCommunityStats()
      .then((rows) => setStats(new Map(rows.map((r) => [r.item, r]))))
      .catch((e) => console.error("getCommunityStats", e));
  }, []);

  if (!hydrated)
    return <p className="font-mono text-xs text-mono-muted">LOADING…</p>;

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
            GATE B4 · CK 02
          </div>
          <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
            The Manifest
          </h1>
          <p className="mt-1.5 text-[14.5px] text-ink-muted">
            {profile.completed ? (
              <>
                Tailored for {profile.name || "you"}
                {profile.university ? ` · ${profile.university}` : ""}
                {profile.city ? ` · ${profile.city}` : ""}
                {profile.intake ? ` · ${profile.intake} intake` : ""}
                {profile.housing ? ` · ${profile.housing}` : ""}.
              </>
            ) : (
              <>
                Showing general verdicts.{" "}
                <Link href="/check-in" className="text-primary underline">
                  Check-In
                </Link>{" "}
                to personalize them.
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[22px] font-bold text-ink">
            {list.length}
          </div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-mono-muted">
            ITEMS ON LIST
          </div>
        </div>
      </div>

      {isSignedIn && list.length > 0 && (
        <Link
          href="/debrief"
          className="flex items-center justify-between gap-3 rounded-xl border border-card-border bg-[#f6f1e6] px-4 py-3 text-[13.5px] transition-colors hover:bg-[#efe7d3]"
        >
          <span className="flex items-center gap-2 text-ink-muted">
            <span
              className="h-[7px] w-[7px] rounded-full bg-accent"
              style={{ animation: "ck-blink 1.4s steps(1) infinite" }}
            />
            <span className="font-mono text-[10.5px] tracking-[0.14em] text-accent">
              POST-FLIGHT
            </span>
            <span>Already arrived? Debrief what worked — it strengthens The Hold.</span>
          </span>
          <span className="font-semibold text-primary">Debrief →</span>
        </Link>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat);
        if (!items?.length) return null;
        return (
          <section key={cat} className="flex flex-col gap-2">
            <h2 className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-mono-muted">
              {CATEGORY_LABEL[cat]}
            </h2>
            <div className="overflow-hidden rounded-[14px] border border-card-border bg-card shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]">
              {items.map((it, idx) => {
                const hold = getHoldItem(it.holdKey);
                if (!hold) return null;
                const guidance = resolveGuidance(hold, profile);
                const open = expanded === it.id;
                return (
                  <div
                    key={it.id}
                    className={idx === 0 ? "p-4" : "border-t border-divider p-4"}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isListed(it.id)}
                        onChange={() => toggleListItem(it.id)}
                        className="mt-[3px] h-[17px] w-[17px] flex-shrink-0 cursor-pointer accent-primary"
                        aria-label={`Add ${it.name} to my list`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[15px] font-semibold">
                            {it.name}
                          </span>
                          <span className="font-mono text-[11px] text-mono-muted">
                            {it.weightKg.toFixed(1)} kg
                          </span>
                        </div>
                        <button
                          onClick={() => setExpanded(open ? null : it.id)}
                          className="mt-[3px] text-[12.5px] text-mono-muted underline underline-offset-2"
                        >
                          {open ? "Hide why" : "Why?"}
                        </button>
                        {open && (
                          <div className="mt-2.5 flex flex-col gap-2 border-l-2 border-[#eadfcb] pl-3">
                            <p className="m-0 text-[13.5px] leading-[1.55] text-ink-muted">
                              {hold.detail}
                            </p>
                            {guidance.personalNotes.map((n, i) => (
                              <p
                                key={i}
                                className="m-0 text-[13.5px] leading-[1.5] text-ink"
                              >
                                <span className="font-bold text-primary">
                                  For you:
                                </span>{" "}
                                {n}
                              </p>
                            ))}
                            {hold.price?.note && (
                              <p className="m-0 text-[12.5px] text-ink-muted">
                                💰 {hold.price.note}
                              </p>
                            )}
                            <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#a79e8b]">
                              Confidence {hold.confidence}
                              {hold.claimIds?.length
                                ? ` · ${hold.claimIds.length} source${hold.claimIds.length > 1 ? "s" : ""} in The Hold`
                                : ""}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <VerdictBadge
                          verdict={guidance.verdict}
                          contested={hold.contested}
                        />
                        <CommunityStat stat={stats.get(it.holdKey)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="sticky bottom-4 mx-auto flex w-full max-w-[440px] items-center justify-between gap-3 rounded-full border border-[#22344f] bg-nav py-2.5 pl-5 pr-3 shadow-[0_18px_34px_-20px_rgba(6,12,24,0.7)]">
        <span className="text-[14px] text-[#e7edf7]">
          {list.length} item{list.length === 1 ? "" : "s"} ready to weigh
        </span>
        <Link
          href="/weigh-in"
          className={
            list.length === 0
              ? "pointer-events-none flex h-[38px] items-center rounded-full bg-accent px-[18px] text-[13.5px] font-semibold text-accent-ink opacity-50"
              : "flex h-[38px] items-center rounded-full bg-accent px-[18px] text-[13.5px] font-semibold text-accent-ink"
          }
        >
          Weigh-In →
        </Link>
      </div>
    </div>
  );
}
