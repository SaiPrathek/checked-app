"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useApp } from "@/lib/store";
import { PACKING_ITEMS } from "@/lib/packing-items";
import { getHoldItem } from "@/lib/hold";
import { driverLabel, isItemVisible, itemName, qtyDrivers, recommendedQty, resolveDetail, resolveGuidance } from "@/lib/guidance";
import { CLIMATE_LABELS } from "@/lib/climate";
import { PROFILE_LABELS } from "@/lib/profile";
import type { Category, CustomItem, PackingItem, Profile, Verdict } from "@/lib/types";
import { isCustomItemId } from "@/lib/types";
import { CHECKLIST, checklistFor, checklistProgress, type ChecklistRow } from "@/lib/checklist";
import { classifyCustomItem } from "@/lib/actions/claude";
import { ItemIcon } from "@/components/item-icon";
import { VerdictBadge } from "@/components/ui/verdict-badge";
import { CommunityStat } from "@/components/ui/community-stat";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { getCommunityStats } from "@/lib/actions/debrief";
import type { Stat } from "@/lib/debrief";
import { Tour, type TourStep } from "@/components/tour/tour";
import { TourButton } from "@/components/tour/tour-button";
import { useTourController } from "@/lib/tour";

const STEPS_MANIFEST: TourStep[] = [
  {
    anchor: "manifest-totals",
    title: "Your running totals",
    body: "Units and packed weight update live as you add items and change quantities — your at-a-glance bag budget.",
    placement: "bottom",
  },
  {
    anchor: "manifest-tabs",
    title: "Browse by category",
    body: "Documents, clothing, kitchen, medicines and more. Each tab shows how many items are recommended for your profile.",
    placement: "bottom",
  },
  {
    anchor: "manifest-view-toggle",
    title: "Cards or Checklist",
    body: "Cards are the packable items that flow into Weigh-In. Switch to Checklist for the full gather-and-prep list (visas, transcripts, receipts) you just tick off.",
    placement: "bottom",
  },
  {
    anchor: "manifest-add-item",
    title: "Add your own item",
    body: "Missing something? Add it and let Checked AI fill in the category, weight and a bring-or-buy verdict for you — all editable.",
    placement: "bottom",
  },
  {
    anchor: "manifest-select-all",
    title: "Select all at once",
    body: "Add or clear every item in this category in one tap, then fine-tune from there.",
    placement: "bottom",
  },
  {
    anchor: "manifest-card",
    title: "Each item, explained",
    body: "Tick to add it, use the stepper to set how many, and open “Why?” to see the bring-from-India / buy-in-US reasoning tuned to you.",
    placement: "bottom",
  },
  {
    anchor: "manifest-weigh-cta",
    title: "On to Weigh-In",
    body: "When your list looks right, head to Weigh-In to pack everything into bags and stay under the airline limits.",
    placement: "top",
  },
];

const CATEGORY_OPTIONS: Category[] = [
  "documents", "medicines", "clothing", "bedding", "kitchen",
  "food", "toiletries", "electronics", "stationery", "misc", "money",
];

/** A CustomItem rendered through the same ManifestRow as catalog items. */
function customAsPackingItem(c: CustomItem): PackingItem {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    weightKg: c.weightKg,
    volumeL: c.volumeL,
    transport: c.transport,
    verdict: c.verdict,
    detail: c.note,
    baseQty: 1,
  };
}

const CATEGORY_ORDER: Category[] = [
  "documents",
  "medicines",
  "clothing",
  "bedding",
  "kitchen",
  "food",
  "toiletries",
  "electronics",
  "stationery",
  "misc",
  "money",
];

const CATEGORY_LABEL: Record<Category, string> = {
  documents: "Documents",
  medicines: "Medicines & health",
  clothing: "Clothing",
  bedding: "Bedding",
  kitchen: "Kitchen",
  food: "Food",
  toiletries: "Toiletries & supplies",
  electronics: "Electronics",
  stationery: "Stationery",
  misc: "Miscellaneous",
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
    customItems,
    saveCustomItem,
    removeCustomItem,
    getPackable,
    checkedOff,
    isChecked,
    setChecked,
    setCheckedMany,
  } = useApp();
  const { isSignedIn } = useUser();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("documents");
  const [stats, setStats] = useState<Map<string, Stat>>(new Map());
  const [view, setView] = useState<"cards" | "checklist">("cards");
  const [adding, setAdding] = useState(false);
  const tour = useTourController("manifest", { canAutoStart: hydrated });

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

  // Custom items grouped into their category, rendered through ManifestRow.
  const customByCategory = useMemo(() => {
    const map = new Map<Category, PackingItem[]>();
    for (const c of customItems) {
      const arr = map.get(c.category) ?? [];
      arr.push(customAsPackingItem(c));
      map.set(c.category, arr);
    }
    return map;
  }, [customItems]);

  // A category tab appears if it has packable cards, custom items, or checklist rows.
  const availableCategories = useMemo(
    () =>
      CATEGORY_ORDER.filter(
        (category) =>
          visibleItems.some((item) => item.category === category) ||
          customByCategory.has(category) ||
          CHECKLIST.some((r) => r.category === category),
      ),
    [visibleItems, customByCategory],
  );
  const activeItems = [
    ...(grouped.get(activeCategory) ?? []),
    ...(customByCategory.get(activeCategory) ?? []),
  ];
  const activeNotNeeded = notNeeded.filter(
    (item) => item.category === activeCategory,
  );
  const activeChecklist = useMemo(
    () => checklistFor(activeCategory, profile),
    [activeCategory, profile],
  );
  const checklistDone = checklistProgress(activeChecklist, checkedOff);

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
          <div className="mb-2 flex items-center gap-2.5">
            <span className="font-mono text-[11px] tracking-[0.2em] text-mono-muted">
              GATE B4 · CK 02
            </span>
            <TourButton onClick={tour.start} />
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
        <div className="flex items-end gap-6 text-right" data-tour="manifest-totals">
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
                  const it = getPackable(id);
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
          data-tour="manifest-tabs"
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-4 py-3">
            <div className="flex items-center gap-3">
              <h2 className="m-0 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-mono-muted">
                {CATEGORY_LABEL[activeCategory]}
              </h2>
              {/* Cards | Checklist view toggle */}
              <div className="flex items-center gap-1 rounded-full border border-field-border bg-[#f6f1e6] p-0.5" data-tour="manifest-view-toggle">
                <ManifestViewButton active={view === "cards"} onClick={() => setView("cards")}>Cards</ManifestViewButton>
                <ManifestViewButton
                  active={view === "checklist"}
                  onClick={() => { setView("checklist"); setAdding(false); }}
                  disabled={activeChecklist.length === 0}
                >
                  Checklist
                </ManifestViewButton>
              </div>
            </div>
            {view === "cards" ? (
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-ink-muted">
                  {activeItems.filter((it) => isListed(it.id)).length}/{activeItems.length} selected
                </span>
                <button
                  type="button"
                  data-tour="manifest-add-item"
                  onClick={() => setAdding((v) => !v)}
                  className="rounded-full border border-field-border bg-card px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-primary hover:text-primary"
                >
                  {adding ? "Close" : "+ Add item"}
                </button>
                {activeItems.length > 0 && (() => {
                  const unlisted = activeItems.filter((it) => !isListed(it.id));
                  const allSelected = unlisted.length === 0;
                  return (
                    <button
                      type="button"
                      data-tour="manifest-select-all"
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
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-ink-muted">
                  {checklistDone.done}/{checklistDone.total} gathered
                </span>
                <button
                  type="button"
                  onClick={() => setCheckedMany(activeChecklist.map((r) => r.id), checklistDone.done < checklistDone.total)}
                  className="rounded-full border border-field-border bg-card px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-primary hover:text-primary"
                >
                  {checklistDone.done < checklistDone.total ? "Check all" : "Clear"}
                </button>
              </div>
            )}
          </div>

          {view === "checklist" ? (
            <ChecklistTable rows={activeChecklist} isChecked={isChecked} setChecked={setChecked} />
          ) : (
          <>
          {adding && (
            <AddCustomForm
              defaultCategory={activeCategory}
              onCancel={() => setAdding(false)}
              onSave={(item) => {
                saveCustomItem(item);
                if (!isListed(item.id)) toggleListItem(item.id);
                setActiveCategory(item.category);
                setAdding(false);
              }}
            />
          )}
          {activeItems.map((it, idx) => (
            <ManifestRow
              key={it.id}
              item={it}
              profile={profile}
              first={idx === 0 && !adding}
              listed={isListed(it.id)}
              qty={qtyFor(it.id)}
              open={expanded === it.id}
              stat={it.holdKey ? stats.get(it.holdKey) : undefined}
              onToggle={() => toggleListItem(it.id)}
              onQty={(qty) => setQtyForItem(it.id, qty)}
              onOpen={() => setExpanded(expanded === it.id ? null : it.id)}
              onRemove={isCustomItemId(it.id) ? () => removeCustomItem(it.id) : undefined}
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
                stat={it.holdKey ? stats.get(it.holdKey) : undefined}
                onToggle={() => toggleListItem(it.id)}
                onQty={(qty) => setQtyForItem(it.id, qty)}
                onOpen={() => setExpanded(expanded === it.id ? null : it.id)}
              />
                ))}
              </div>
            </details>
          )}
          </>
          )}
        </div>
      </section>

      <div data-tour="manifest-weigh-cta" className="sticky bottom-4 mx-auto flex w-full max-w-[440px] items-center justify-between gap-3 rounded-full border border-[#22344f] bg-nav py-2.5 pl-5 pr-3 shadow-[0_18px_34px_-20px_rgba(6,12,24,0.7)]">
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

      <Tour steps={STEPS_MANIFEST} open={tour.open} onClose={tour.close} />
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
  onRemove,
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
  onRemove?: () => void;
}) {
  const hold = getHoldItem(item.holdKey);
  const guidance = resolveGuidance(hold, profile, item);
  const detail = resolveDetail(hold, item);
  const displayName = itemName(item, profile);
  const coordinate = item.shareable && profile.roommates === "roommates";
  const drivers = qtyDrivers(item, profile);
  const recommended = recommendedQty(item, profile);

  return (
    <div
      className={first ? "p-4" : "border-t border-divider p-4"}
      data-tour={first ? "manifest-card" : undefined}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={listed}
          onChange={onToggle}
          className="mt-[3px] h-[17px] w-[17px] flex-shrink-0 cursor-pointer accent-primary"
          aria-label={`Add ${displayName} to my list`}
        />
        <span className="mt-px flex-shrink-0 rounded-[8px] border border-card-border bg-[#f6f1e6] p-1">
          <ItemIcon item={item} size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-semibold">{displayName}</span>
            <span className="font-mono text-[11px] text-mono-muted">
              {item.weightKg.toFixed(1)} kg
              {listed && qty > 1 && <> · {(item.weightKg * qty).toFixed(1)} total</>}
            </span>
            {onRemove && (
              <span className="rounded-full border border-[#d8cebb] bg-[#f6f1e6] px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-mono-muted">
                Yours
              </span>
            )}
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
              <div className="flex items-start gap-2.5">
                <span className="mt-px flex-shrink-0 rounded-[8px] border border-card-border bg-[#f6f1e6] p-1.5">
                  <ItemIcon item={item} size={30} />
                </span>
                <p className="m-0 text-[13.5px] leading-[1.55] text-ink-muted">{detail}</p>
              </div>
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
              {guidance.shifted && hold && (
                <p className="m-0 text-[13px] leading-[1.5] text-ink">
                  <span className="font-bold text-primary">Verdict shifted for your profile</span> — the corpus default was <em>{hold.verdict}</em>.
                </p>
              )}
              {guidance.personalNotes.map((note, index) => (
                <p key={index} className="m-0 text-[13.5px] leading-[1.5] text-ink">
                  <span className="font-bold text-primary">For you:</span> {note}
                </p>
              ))}
              {hold?.price?.note && <p className="m-0 text-[12.5px] text-ink-muted">💰 {hold.price.note}</p>}
              {hold ? (
                <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#a79e8b]">
                  Confidence {hold.confidence}
                  {hold.tags?.includes("community-pending")
                    ? " · community pending"
                    : hold.claimIds?.length
                      ? ` · ${hold.claimIds.length} source${hold.claimIds.length > 1 ? "s" : ""} in The Hold`
                      : ""}
                </p>
              ) : (
                <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#a79e8b]">
                  From your packing checklist
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <VerdictBadge verdict={guidance.verdict} contested={hold?.contested ?? false} />
          <CommunityStat stat={stat} />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${displayName}`}
              title="Remove this custom item"
              className="grid h-6 w-6 place-items-center rounded-full text-mono-muted transition-colors hover:bg-[#fbe8e5] hover:text-[#b23127]"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ManifestViewButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        active
          ? "rounded-full bg-nav px-3 py-1 text-[12px] font-semibold text-nav-text"
          : "rounded-full px-3 py-1 text-[12px] font-semibold text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      }
    >
      {children}
    </button>
  );
}

const BUYING_PLACE: Record<ChecklistRow["buyingPlace"], { label: string; cls: string }> = {
  IN: { label: "India", cls: "border-[#b9d8ca] bg-[#edf7f1] text-good" },
  US: { label: "USA", cls: "border-[#bdd6f5] bg-[#e7f0fb] text-[#1257b8]" },
  NA: { label: "Prepare", cls: "border-field-border bg-[#f6f1e6] text-mono-muted" },
};

function ChecklistTable({
  rows,
  isChecked,
  setChecked,
}: {
  rows: ChecklistRow[];
  isChecked: (key: string) => boolean;
  setChecked: (key: string, checked: boolean) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[13px] text-ink-muted">
        No checklist rows for this section.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-divider bg-[#f6f1e6] font-mono text-[10px] uppercase tracking-[0.14em] text-mono-muted">
            <th className="w-10 px-4 py-2.5 text-center" scope="col">✓</th>
            <th className="px-2 py-2.5" scope="col">Item</th>
            <th className="px-2 py-2.5" scope="col">Quantity</th>
            <th className="px-2 py-2.5" scope="col">Buying place</th>
            <th className="px-2 py-2.5 pr-4" scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const checked = isChecked(row.id);
            const bp = BUYING_PLACE[row.buyingPlace];
            return (
              <tr
                key={row.id}
                className={
                  "border-b border-divider align-top transition-colors " +
                  (checked ? "bg-[#f3f8f2]" : "hover:bg-[#faf6ec]")
                }
              >
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(row.id, e.target.checked)}
                    className="h-[17px] w-[17px] cursor-pointer accent-good"
                    aria-label={`Mark ${row.item} as gathered`}
                  />
                </td>
                <td className="px-2 py-3">
                  <span className={"text-[13.5px] font-semibold " + (checked ? "text-mono-muted line-through" : "text-ink")}>
                    {row.item}
                  </span>
                </td>
                <td className="px-2 py-3 font-mono text-[12px] text-ink-muted">{row.quantity}</td>
                <td className="px-2 py-3">
                  <span className={"inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold " + bp.cls}>
                    {bp.label}
                  </span>
                </td>
                <td className="px-2 py-3 pr-4 text-[12.5px] text-ink-muted">{row.note ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AddCustomForm({
  defaultCategory,
  onSave,
  onCancel,
}: {
  defaultCategory: Category;
  onSave: (item: CustomItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [weightKg, setWeightKg] = useState("0.3");
  const [verdict, setVerdict] = useState<Verdict>("bring-from-india");
  const [note, setNote] = useState("");
  const [aiFilled, setAiFilled] = useState(false);
  const [classifying, setClassifying] = useState(false);

  async function askCheckedAI() {
    if (!name.trim()) return;
    setClassifying(true);
    try {
      const r = await classifyCustomItem(name.trim());
      if (r.name) setName(r.name);
      if (r.category) setCategory(r.category);
      if (typeof r.weightKg === "number") setWeightKg(String(r.weightKg));
      if (r.verdict) setVerdict(r.verdict);
      if (r.note) setNote(r.note);
      setAiFilled(r.aiFilled);
    } catch (e) {
      console.error("classifyCustomItem", e);
    } finally {
      setClassifying(false);
    }
  }

  function save() {
    const clean = name.trim();
    if (!clean) return;
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
    const item: CustomItem = {
      id: `custom:${slug}-${Date.now().toString(36)}`,
      name: clean,
      category,
      weightKg: Math.max(0.01, Number(weightKg) || 0.3),
      verdict,
      note: note.trim() || undefined,
      aiFilled,
      createdAt: new Date().toISOString(),
    };
    onSave(item);
  }

  return (
    <div className="flex flex-col gap-3 border-b border-divider bg-[#f6f1e6] p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mono-muted">Item name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") askCheckedAI(); }}
            placeholder="e.g. Yoga mat"
            className="h-10 rounded-[9px] border border-field-border bg-card px-3 text-[14px] text-ink"
          />
        </label>
        <button
          type="button"
          onClick={askCheckedAI}
          disabled={!name.trim() || classifying}
          className="h-10 rounded-[9px] border border-primary bg-card px-3.5 text-[13px] font-semibold text-primary transition-colors hover:bg-[#eef2fb] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {classifying ? "Asking Checked AI…" : "✦ Ask Checked AI to fill this in"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mono-muted">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="h-9 rounded-[9px] border border-field-border bg-card px-2 text-[13px] text-ink"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mono-muted">Weight (kg)</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="h-9 w-24 rounded-[9px] border border-field-border bg-card px-2 text-[13px] text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mono-muted">Verdict</span>
          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value as Verdict)}
            className="h-9 rounded-[9px] border border-field-border bg-card px-2 text-[13px] text-ink"
          >
            <option value="bring-from-india">Bring from India</option>
            <option value="buy-in-us">Buy in the US</option>
            <option value="either">Either</option>
            <option value="skip">Skip</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mono-muted">
          Note {aiFilled && <span className="text-primary">· AI-filled, edit freely</span>}
        </span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional — why bring/buy/skip"
          className="h-9 rounded-[9px] border border-field-border bg-card px-3 text-[13px] text-ink"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!name.trim()}
          className="h-10 rounded-[9px] bg-primary px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to Manifest
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-[9px] border border-field-border bg-card px-4 text-[13.5px] font-semibold text-ink-muted transition-colors hover:bg-divider"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
