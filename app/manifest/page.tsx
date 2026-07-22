"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useApp } from "@/lib/store";
import { PACKING_ITEMS } from "@/lib/packing-items";
import { getHoldItem } from "@/lib/hold";
import { driverLabel, isItemVisible, itemName, qtyDrivers, recommendedQty, resolveGuidance } from "@/lib/guidance";
import { CLIMATE_LABELS } from "@/lib/climate";
import { PROFILE_LABELS } from "@/lib/profile";
import type { Category, PackingItem, Profile } from "@/lib/types";
import { VerdictBadge } from "@/components/ui/verdict-badge";
import { CommunityStat } from "@/components/ui/community-stat";
import { QtyStepper } from "@/components/ui/qty-stepper";
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
  const {
    profile,
    list,
    toggleListItem,
    isListed,
    hydrated,
    qtyFor,
    setQtyForItem,
  } = useApp();
  const { isSignedIn } = useUser();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("documents");
  const [stats, setStats] = useState<Map<string, Stat>>(new Map());

  const visibleItems = useMemo(
    () => PACKING_ITEMS.filter((item) => isItemVisible(item, profile)),
    [profile],
  );

  const grouped = useMemo(() => {
    const map = new Map<Category, PackingItem[]>();
    for (const it of visibleItems) {
      if (recommendedQty(it, profile) === 0 && !list.includes(it.id)) continue;
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return map;
  }, [list, profile, visibleItems]);

  const notNeeded = useMemo(
    () => visibleItems.filter((item) => recommendedQty(item, profile) === 0 && !list.includes(item.id)),
    [list, profile, visibleItems],
  );

  const availableCategories = useMemo(
    () => CATEGORY_ORDER.filter((category) =>
      visibleItems.some((item) => item.category === category),
    ),
    [visibleItems],
  );
  const activeItems = grouped.get(activeCategory) ?? [];
  const activeNotNeeded = notNeeded.filter(
    (item) => item.category === activeCategory,
  );

  useEffect(() => {
    if (!availableCategories.includes(activeCategory) && availableCategories[0]) {
      setActiveCategory(availableCategories[0]);
    }
  }, [activeCategory, availableCategories]);

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
        <div className="flex items-end gap-6 text-right">
          <div>
            <div className="font-mono text-[22px] font-bold text-ink">
              {list.reduce((s, id) => s + qtyFor(id), 0)}
            </div>
            <div className="font-mono text-[10px] tracking-[0.16em] text-mono-muted">
              UNITS
            </div>
          </div>
          <div>
            <div className="font-mono text-[22px] font-bold text-ink">
              {list
                .reduce((s, id) => {
                  const it = PACKING_ITEMS.find((p) => p.id === id);
                  return s + (it ? it.weightKg * qtyFor(id) : 0);
                }, 0)
                .toFixed(1)}
              <span className="ml-0.5 text-[13px] font-medium text-mono-muted">
                kg
              </span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.16em] text-mono-muted">
              PACKED WEIGHT
            </div>
          </div>
        </div>
      </div>

      {profile.completed && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-card-border bg-[#f6f1e6] px-4 py-3">
          <span className="mr-1 font-mono text-[10px] font-bold tracking-[0.14em] text-mono-muted">
            TUNED FOR
          </span>
          <ProfileChip
            href="/check-in?edit=university"
            label={profile.city && profile.state
              ? `${profile.city}, ${profile.state}${profile.climate ? ` · ${CLIMATE_LABELS[profile.climate]}` : ""}`
              : profile.university || "Destination"}
          />
          {profile.dietPractice && (
            <ProfileChip href="/check-in?edit=dietPractice" label={PROFILE_LABELS.dietPractice[profile.dietPractice]} />
          )}
          {profile.cuisine && (
            <ProfileChip href="/check-in?edit=cuisine" label={PROFILE_LABELS.cuisine[profile.cuisine]} />
          )}
          {profile.housing && (
            <ProfileChip
              href="/check-in?edit=housing"
              label={`${profile.housing === "dorm" ? "Dorm" : "Apartment"}${profile.roommates === "roommates" ? " · roommates" : profile.roommates === "alone" ? " · solo" : ""}`}
            />
          )}
          {profile.cooking && (
            <ProfileChip href="/check-in?edit=cooking" label={`Cooks ${PROFILE_LABELS.cooking[profile.cooking].toLowerCase()}`} />
          )}
        </div>
      )}

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

      <section className="overflow-hidden rounded-[14px] border border-card-border bg-card shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]">
        <div
          role="tablist"
          aria-label="Manifest categories"
          className="flex overflow-x-auto border-b border-card-border bg-[#f6f1e6] p-1.5"
        >
          {availableCategories.map((category) => {
            const selected = category === activeCategory;
            // Count matches the "N recommended" shown in the panel — items surfaced by default.
            const count = (grouped.get(category) ?? []).length;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                id={`manifest-tab-${category}`}
                aria-selected={selected}
                aria-controls={`manifest-panel-${category}`}
                onClick={() => {
                  setActiveCategory(category);
                  setExpanded(null);
                }}
                className={
                  selected
                    ? "shrink-0 rounded-[9px] bg-nav px-3.5 py-2.5 text-left text-nav-text shadow-sm"
                    : "shrink-0 rounded-[9px] px-3.5 py-2.5 text-left text-ink-muted transition-colors hover:bg-card hover:text-ink"
                }
              >
                <span className="block whitespace-nowrap text-[12.5px] font-semibold">
                  {CATEGORY_LABEL[category]}
                </span>
                <span className={selected
                  ? "mt-0.5 block font-mono text-[9.5px] tracking-[0.1em] text-nav-muted"
                  : "mt-0.5 block font-mono text-[9.5px] tracking-[0.1em] text-mono-muted"}
                >
                  {count} ITEM{count === 1 ? "" : "S"}
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`manifest-panel-${activeCategory}`}
          aria-labelledby={`manifest-tab-${activeCategory}`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3">
            <h2 className="m-0 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-mono-muted">
              {CATEGORY_LABEL[activeCategory]}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-ink-muted">
                {activeItems.filter((it) => isListed(it.id)).length}/{activeItems.length} selected
              </span>
              {activeItems.length > 0 && (() => {
                const unlisted = activeItems.filter((it) => !isListed(it.id));
                const allSelected = unlisted.length === 0;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      const targets = allSelected ? activeItems.filter((it) => isListed(it.id)) : unlisted;
                      targets.forEach((it) => toggleListItem(it.id));
                    }}
                    className="rounded-full border border-field-border bg-card px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    {allSelected ? "Clear all" : "Select all"}
                  </button>
                );
              })()}
            </div>
          </div>
          {activeItems.map((it, idx) => (
            <ManifestRow
              key={it.id}
              item={it}
              profile={profile}
              first={idx === 0}
              listed={isListed(it.id)}
              qty={qtyFor(it.id)}
              open={expanded === it.id}
              stat={stats.get(it.holdKey)}
              onToggle={() => toggleListItem(it.id)}
              onQty={(qty) => setQtyForItem(it.id, qty)}
              onOpen={() => setExpanded(expanded === it.id ? null : it.id)}
            />
          ))}

          {activeNotNeeded.length > 0 && (
            <details className="border-t border-card-border bg-[#f6f1e6]">
              <summary className="cursor-pointer px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-mono-muted">
                Not needed for you · {activeNotNeeded.length} item{activeNotNeeded.length === 1 ? "" : "s"}
              </summary>
              <div className="border-t border-card-border bg-card opacity-70">
                {activeNotNeeded.map((it, idx) => (
              <ManifestRow
                key={it.id}
                item={it}
                profile={profile}
                first={idx === 0}
                listed={false}
                qty={0}
                open={expanded === it.id}
                stat={stats.get(it.holdKey)}
                onToggle={() => toggleListItem(it.id)}
                onQty={(qty) => setQtyForItem(it.id, qty)}
                onOpen={() => setExpanded(expanded === it.id ? null : it.id)}
              />
                ))}
              </div>
            </details>
          )}
        </div>
      </section>

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

function ProfileChip({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-full border border-field-border bg-card px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-primary hover:text-primary">
      {label} ↗
    </Link>
  );
}

function ManifestRow({
  item,
  profile,
  first,
  listed,
  qty,
  open,
  stat,
  onToggle,
  onQty,
  onOpen,
}: {
  item: PackingItem;
  profile: Profile;
  first: boolean;
  listed: boolean;
  qty: number;
  open: boolean;
  stat?: Stat;
  onToggle: () => void;
  onQty: (qty: number) => void;
  onOpen: () => void;
}) {
  const hold = getHoldItem(item.holdKey);
  if (!hold) return null;
  const guidance = resolveGuidance(hold, profile, item);
  const displayName = itemName(item, profile);
  const coordinate = item.shareable && profile.roommates === "roommates";
  const drivers = qtyDrivers(item, profile);
  const recommended = recommendedQty(item, profile);

  return (
    <div className={first ? "p-4" : "border-t border-divider p-4"}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={listed}
          onChange={onToggle}
          className="mt-[3px] h-[17px] w-[17px] flex-shrink-0 cursor-pointer accent-primary"
          aria-label={`Add ${displayName} to my list`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-semibold">{displayName}</span>
            <span className="font-mono text-[11px] text-mono-muted">
              {item.weightKg.toFixed(1)} kg
              {listed && qty > 1 && <> · {(item.weightKg * qty).toFixed(1)} total</>}
            </span>
          </div>
          {coordinate && (
            <span className="mt-1.5 inline-flex rounded-full border border-[#b9d8ca] bg-[#edf7f1] px-2.5 py-1 text-[11px] font-semibold text-good">
              🤝 coordinate with roommates
            </span>
          )}
          {listed && !coordinate && (
            <div className="mt-2 flex items-center gap-2">
              <QtyStepper value={qty} onChange={onQty} label={`Quantity of ${displayName}`} />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-mono-muted">QTY</span>
            </div>
          )}
          <button onClick={onOpen} className="mt-[6px] text-[12.5px] text-mono-muted underline underline-offset-2">
            {open ? "Hide why" : "Why?"}
          </button>
          {open && (
            <div className="mt-2.5 flex flex-col gap-2 border-l-2 border-[#eadfcb] pl-3">
              <p className="m-0 text-[13.5px] leading-[1.55] text-ink-muted">{hold.detail}</p>
              {drivers.length > 0 && (
                <p className="m-0 text-[13px] leading-[1.5] text-ink">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mono-muted">RECOMMENDED {recommended}</span>
                  <span className="mx-1.5 text-mono-muted">·</span>
                  {drivers.map((d, i) => (
                    <span key={`${d.dimension}-${d.value}`}>
                      {i > 0 && <span className="mx-1 text-mono-muted">·</span>}
                      <span className="text-ink-muted">{driverLabel(d)}</span>{" "}
                      <span className={d.delta > 0 ? "font-mono font-bold text-good" : "font-mono font-bold text-over"}>
                        {d.delta > 0 ? "+" : ""}{d.delta}
                      </span>
                    </span>
                  ))}
                </p>
              )}
              {guidance.shifted && (
                <p className="m-0 text-[13px] leading-[1.5] text-ink">
                  <span className="font-bold text-primary">Verdict shifted for your profile</span> — the corpus default was <em>{hold.verdict}</em>.
                </p>
              )}
              {guidance.personalNotes.map((note, index) => (
                <p key={index} className="m-0 text-[13.5px] leading-[1.5] text-ink">
                  <span className="font-bold text-primary">For you:</span> {note}
                </p>
              ))}
              {hold.price?.note && <p className="m-0 text-[12.5px] text-ink-muted">💰 {hold.price.note}</p>}
              <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#a79e8b]">
                Confidence {hold.confidence}
                {hold.tags?.includes("community-pending")
                  ? " · community pending"
                  : hold.claimIds?.length
                    ? ` · ${hold.claimIds.length} source${hold.claimIds.length > 1 ? "s" : ""} in The Hold`
                    : ""}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <VerdictBadge verdict={guidance.verdict} contested={hold.contested} />
          <CommunityStat stat={stat} />
        </div>
      </div>
    </div>
  );
}
