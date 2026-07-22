"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  BAG_CATALOG,
  bagDef,
  type BagId,
  type Packable,
} from "@/lib/types";
import {
  bagSpecsFrom,
  computeLoadsheet,
  placementWarning,
  unitVolumeL,
  type LoadsheetNote,
} from "@/lib/loadsheet";
import { Meter } from "@/components/ui/meter";
import { ItemIcon } from "@/components/item-icon";
import { Tour, type TourStep } from "@/components/tour/tour";
import { TourButton } from "@/components/tour/tour-button";
import { useTourController } from "@/lib/tour";

const STEPS_WEIGHIN: TourStep[] = [
  {
    anchor: "weighin-autopack",
    title: "Auto-Pack for you",
    body: "One tap builds an optimal, rule-aware loadsheet — spreading weight across your bags and keeping cabin-only items (laptop, meds, documents) where they belong.",
    placement: "bottom",
  },
  {
    anchor: "weighin-fleet",
    title: "Your bag fleet",
    body: "This is what you're flying with. Remove a bag with ✕ or add the cabin/backpack — every weight limit and the packing plan adjust automatically.",
    placement: "bottom",
  },
  {
    anchor: "weighin-view-toggle",
    title: "Two ways to pack",
    body: "Suitcase is the visual, tap-to-pack view. Classic list is a drag-and-drop columns view. Use whichever you prefer — the totals are the same.",
    placement: "bottom",
  },
  {
    anchor: "weighin-bag-tabs",
    title: "Switch between bags",
    body: "Each tab shows a bag and its live weight against the limit — it turns red the moment you go over.",
    placement: "bottom",
  },
  {
    anchor: "weighin-tray",
    title: "The tray → the case",
    body: "Unpacked items wait in the tray. Tap one to drop it into the open bag; tap it inside the case to send it back.",
    placement: "right",
  },
  {
    anchor: "weighin-meters",
    title: "Weight & space, live",
    body: "Pick a case size and watch both meters. Stay in the green and you're under the airline limit with room to spare.",
    placement: "top",
  },
];

/** Units of one item inside one bag (or the tray). */
interface BagLine {
  item: Packable;
  units: number;
  kg: number;
  volL: number;
}

interface BagConfig {
  preset: string;
  w: number;
  h: number;
  d: number;
}

const PRESETS = [
  { id: "backpack", label: "Backpack 45 cm", w: 45, h: 32, d: 20 },
  { id: "cabin", label: "Cabin 55 cm", w: 55, h: 40, d: 20 },
  { id: "medium", label: "Medium 24″", w: 61, h: 43, d: 26 },
  { id: "large", label: "Large 28″", w: 71, h: 48, d: 30 },
  { id: "trunk", label: "Trunk 30″", w: 76, h: 52, d: 32 },
  { id: "custom", label: "Custom" },
] as const;

const DEFAULT_CONFIG: Record<BagId, BagConfig> = {
  bag1: { preset: "large", w: 71, h: 48, d: 30 },
  bag2: { preset: "medium", w: 61, h: 43, d: 26 },
  cabin: { preset: "cabin", w: 55, h: 40, d: 20 },
  backpack: { preset: "backpack", w: 45, h: 32, d: 20 },
};

function rotationFor(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 97;
  return (hash % 13) - 6;
}

/** Units of an item sitting in currently-active bags (ignores stale allocations). */
function activeAllocated(a: Record<string, number> | undefined, active: BagId[]): number {
  if (!a) return 0;
  return active.reduce((sum, bag) => sum + (a[bag] ?? 0), 0);
}

export default function WeighIn() {
  const {
    list,
    alloc,
    activeBags,
    qtyFor,
    assignBag,
    setUnits,
    applyLoadsheet,
    setBagActive,
    getPackable,
    hydrated,
  } = useApp();
  const [view, setView] = useState<"case" | "classic">("case");
  const [activeBagTab, setActiveBagTab] = useState<BagId>("bag1");
  const [bagConfig, setBagConfig] = useState<Record<BagId, BagConfig>>(DEFAULT_CONFIG);
  const [notes, setNotes] = useState<LoadsheetNote[] | null>(null);
  const tour = useTourController("weighin", { canAutoStart: hydrated && list.length > 0 });

  const items = useMemo(
    () =>
      list
        .map((id) => getPackable(id))
        .filter((item): item is Packable => Boolean(item)),
    [list, getPackable],
  );

  const { perBag, tray, violations, totalPackedKg } = useMemo(() => {
    const perBag: Record<string, BagLine[]> = {};
    for (const b of activeBags) perBag[b] = [];
    const tray: BagLine[] = [];
    const violations: string[] = [];
    let totalPackedKg = 0;
    for (const item of items) {
      const qty = qtyFor(item.id);
      const a = alloc[item.id] ?? {};
      for (const bagId of activeBags) {
        const units = a[bagId] ?? 0;
        if (units <= 0) continue;
        perBag[bagId].push({
          item,
          units,
          kg: item.weightKg * units,
          volL: unitVolumeL(item) * units,
        });
        totalPackedKg += item.weightKg * units;
        const warning = placementWarning(item, bagId);
        if (warning) violations.push(warning);
      }
      const unassigned = qty - activeAllocated(a, activeBags);
      if (unassigned > 0) {
        tray.push({
          item,
          units: unassigned,
          kg: item.weightKg * unassigned,
          volL: unitVolumeL(item) * unassigned,
        });
      }
    }
    return { perBag, tray, violations, totalPackedKg };
  }, [items, alloc, qtyFor, activeBags]);

  if (!hydrated) {
    return <p className="font-mono text-xs text-mono-muted">LOADING…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          GATE C2 · CK 03 · BAGGAGE LAB
        </div>
        <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">Weigh-In</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink-muted">
          Nothing to weigh yet. Add items in The Manifest, then come back to pack them into bags.
        </p>
        <Link href="/manifest" className="mt-5 inline-flex h-11 items-center rounded-[9px] bg-accent px-5 text-[14.5px] font-semibold text-accent-ink">
          Go to The Manifest →
        </Link>
      </div>
    );
  }

  // the tab the config panel points at — fall back if its bag was removed
  const currentBag: BagId = activeBags.includes(activeBagTab) ? activeBagTab : activeBags[0];
  const def = bagDef(currentBag);
  const config = bagConfig[currentBag];
  const packedLines = perBag[currentBag] ?? [];
  const kg = packedLines.reduce((sum, line) => sum + line.kg, 0);
  const packedVolume = packedLines.reduce((sum, line) => sum + line.volL, 0);
  const capacity = ((config.w * config.h * config.d) / 1000) * 0.85;
  const weightOver = kg > def.limitKg;
  const volumeOver = packedVolume > capacity;
  const caseW = Math.round(Math.min(320, Math.max(120, config.w * 3.4)));
  const caseH = Math.round(Math.min(320, Math.max(120, config.h * 3.6)));
  const isBackpack = def.quickAccess === true;

  // The packed-items grid — shared by the suitcase and backpack shells.
  const packedGridChildren =
    packedLines.length > 0 ? (
      packedLines.map((line) => {
        const size = Math.round(Math.min(Math.min(caseW, caseH) * 0.42, Math.max(26, Math.sqrt(line.volL) * 15)));
        return (
          <button
            key={line.item.id}
            type="button"
            title={`${line.item.name}${line.units > 1 ? ` ×${line.units}` : ""} · ${line.kg.toFixed(1)} kg — tap to unpack`}
            onClick={() => setUnits(line.item.id, currentBag, 0)}
            className="relative grid place-items-center rounded-lg border-2 border-card-border bg-card animate-[ck-drop_.45s_cubic-bezier(.2,.8,.3,1.15)]"
            style={{ width: size, height: size, transform: `rotate(${rotationFor(line.item.id)}deg)` }}
          >
            {line.units > 1 && (
              <span className="absolute right-0.5 top-0.5 rounded-full bg-ink px-1 py-px font-mono text-[8px] font-bold text-nav-text">
                ×{line.units}
              </span>
            )}
            <ItemIcon item={line.item} size={Math.round(size * 0.7)} />
          </button>
        );
      })
    ) : (
      <div className="grid h-full w-full place-items-center text-center font-mono text-[10px] leading-[1.8] tracking-[0.12em] text-[#a79e8b]">
        TAP TRAY ITEMS<br />TO PACK — OR ✈ AUTO-PACK
      </div>
    );

  const inactiveBags = BAG_CATALOG.filter((b) => !activeBags.includes(b.id));

  function runAutoPack() {
    const lines = items.map((item) => ({ item, qty: qtyFor(item.id) }));
    const result = computeLoadsheet(lines, bagSpecsFrom(activeBags, bagConfig));
    applyLoadsheet(result.alloc);
    setNotes(result.notes);
  }

  function setPreset(presetId: string) {
    const preset = PRESETS.find((candidate) => candidate.id === presetId);
    setBagConfig((current) => ({
      ...current,
      [currentBag]: preset && "w" in preset
        ? { preset: presetId, w: preset.w, h: preset.h, d: preset.d }
        : { ...current[currentBag], preset: presetId },
    }));
  }

  function setDimension(key: "w" | "h" | "d", value: number) {
    setBagConfig((current) => ({
      ...current,
      [currentBag]: { ...current[currentBag], preset: "custom", [key]: value },
    }));
  }

  function onDrop(event: React.DragEvent, destination: BagId | undefined) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id) assignBag(id, destination);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="font-mono text-[11px] tracking-[0.2em] text-mono-muted">
              GATE C2 · CK 03 · BAGGAGE LAB
            </span>
            <TourButton onClick={tour.start} />
          </div>
          <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">Weigh-In</h1>
          <p className="mt-1.5 max-w-[520px] text-[14.5px] text-ink-muted">
            Set your fleet, then hit Auto-Pack for an optimal, rule-aware loadsheet — or pack by hand. The meters track weight and space live.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-tour="weighin-autopack"
            onClick={runAutoPack}
            className="flex h-11 items-center gap-2 rounded-[9px] bg-accent px-5 text-[14.5px] font-semibold text-accent-ink hover:brightness-[0.96]"
          >
            ✈ Auto-Pack
          </button>
          <div className="text-right">
            <div className="font-mono text-[22px] font-bold">{totalPackedKg.toFixed(1)} kg</div>
            <div className="font-mono text-[10px] tracking-[0.16em] text-mono-muted">TOTAL PACKED</div>
          </div>
        </div>
      </div>

      {/* fleet manager */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-card-border bg-card px-4 py-3" data-tour="weighin-fleet">
        <span className="mr-1 font-mono text-[10px] tracking-[0.16em] text-mono-muted">FLEET</span>
        {activeBags.map((id) => {
          const bag = bagDef(id);
          const canRemove = bag.removable && activeBags.length > 1;
          return (
            <span
              key={id}
              className="flex items-center gap-1.5 rounded-full border border-field-border bg-field py-1 pl-3 pr-1.5 text-[12.5px] font-semibold text-ink"
            >
              {bag.label}
              <span className="font-mono text-[10px] font-normal text-mono-muted">{bag.limitKg}kg</span>
              {canRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${bag.label}`}
                  title={`Remove ${bag.label}`}
                  onClick={() => setBagActive(id, false)}
                  className="grid h-5 w-5 place-items-center rounded-full text-mono-muted hover:bg-[#fbe8e5] hover:text-[#b23127]"
                >
                  ✕
                </button>
              )}
            </span>
          );
        })}
        {inactiveBags.map((bag) => (
          <button
            key={bag.id}
            type="button"
            onClick={() => setBagActive(bag.id, true)}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-field-border bg-transparent px-3 py-1 text-[12.5px] font-semibold text-ink-muted hover:border-accent hover:text-[#9a5b00]"
          >
            + {bag.label}
          </button>
        ))}
      </div>

      {notes && notes.length > 0 && (
        <section className="flex flex-col gap-2 rounded-2xl border border-card-border bg-card p-4 shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] tracking-[0.18em] text-accent">▸ LOADSHEET NOTES</span>
            <button
              type="button"
              onClick={() => setNotes(null)}
              className="font-mono text-[10.5px] tracking-[0.1em] text-mono-muted hover:text-ink"
            >
              DISMISS
            </button>
          </div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {notes.map((note, index) => (
              <li
                key={index}
                className={note.level === "warn"
                  ? "text-[13px] font-semibold text-over"
                  : "text-[13px] text-ink-muted"}
              >
                {note.level === "warn" ? "⚠ " : "· "}
                {note.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {violations.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl border border-[#f2c9c2] bg-[#fbe8e5] px-4 py-3">
          {violations.map((violation, index) => (
            <p key={index} className="m-0 text-[12.5px] font-semibold text-[#b23127]">
              ⚠ {violation}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5" data-tour="weighin-view-toggle">
        <span className="mr-1 font-mono text-[10px] tracking-[0.16em] text-mono-muted">VIEW</span>
        <ViewButton active={view === "case"} onClick={() => setView("case")}>Suitcase</ViewButton>
        <ViewButton active={view === "classic"} onClick={() => setView("classic")}>Classic list</ViewButton>
      </div>

      {view === "case" ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Bags" data-tour="weighin-bag-tabs">
            {activeBags.map((id) => {
              const bag = bagDef(id);
              const bagKg = (perBag[id] ?? []).reduce((sum, line) => sum + line.kg, 0);
              const active = currentBag === id;
              const over = bagKg > bag.limitKg;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveBagTab(id)}
                  className={active
                    ? "h-10 rounded-full border border-nav-deep bg-ink px-4 text-[13.5px] font-semibold text-nav-text"
                    : "h-10 rounded-full border border-field-border bg-card px-4 text-[13.5px] font-semibold text-ink-muted"}
                >
                  {bag.label}
                  <span className={over
                    ? "ml-2 font-mono text-[10.5px] text-[#f08a7f]"
                    : active
                      ? "ml-2 font-mono text-[10.5px] text-accent"
                      : "ml-2 font-mono text-[10.5px] text-mono-muted"}
                  >
                    {bagKg.toFixed(1)}/{bag.limitKg} kg
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid items-stretch gap-[18px] lg:grid-cols-[minmax(280px,1fr)_minmax(360px,1.5fr)]">
            <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-card-border bg-panel p-5" data-tour="weighin-tray">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="m-0 font-display text-[16px] font-bold">Tray</h2>
                <span className="font-mono text-[10px] tracking-[0.14em] text-mono-muted">
                  {tray.length} UNPACKED
                </span>
              </div>
              <p className="m-0 text-[12.5px] text-ink-muted">
                Tap an item to pack it into <strong>{def.label}</strong>. Tap a packed item to take it back out.
              </p>
              {tray.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2">
                  {tray.map((line) => (
                    <button
                      key={line.item.id}
                      type="button"
                      title={`Pack into ${def.label}`}
                      onClick={() =>
                        setUnits(
                          line.item.id,
                          currentBag,
                          (alloc[line.item.id]?.[currentBag] ?? 0) + line.units,
                        )
                      }
                      className="relative flex flex-col items-center gap-1.5 rounded-[10px] border border-card-border bg-card px-2 py-2.5"
                    >
                      {line.units > 1 && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-ink px-1.5 py-0.5 font-mono text-[9px] font-bold text-nav-text">
                          ×{line.units}
                        </span>
                      )}
                      <ItemIcon item={line.item} size={32} />
                      <span className="text-center text-[11.5px] font-semibold leading-[1.25] text-ink">{line.item.name}</span>
                      <span className="font-mono text-[10px] text-mono-muted">{line.kg.toFixed(1)} kg</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-20 flex-1 place-items-center rounded-[9px] border border-dashed border-[#d8cebb] text-center font-mono text-[11px] tracking-[0.1em] text-[#a79e8b]">
                  ALL ITEMS PACKED<br />READY FOR THE COUNTER
                </div>
              )}
            </section>

            <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-card-border bg-card p-5 shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 font-mono text-[10px] tracking-[0.16em] text-mono-muted">SIZE</span>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPreset(preset.id)}
                    className={config.preset === preset.id
                      ? "h-8 rounded-full border border-accent bg-[#fbf1dc] px-[13px] font-mono text-[11px] font-bold text-[#9a5b00]"
                      : "h-8 rounded-full border border-field-border bg-field px-[13px] font-mono text-[11px] text-ink-muted"}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {config.preset === "custom" && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5 rounded-[10px] border border-card-border bg-panel px-3.5 py-3">
                  <Dimension label="WIDTH" value={config.w} min={30} max={90} onChange={(value) => setDimension("w", value)} />
                  <Dimension label="HEIGHT" value={config.h} min={30} max={90} onChange={(value) => setDimension("h", value)} />
                  <Dimension label="DEPTH" value={config.d} min={12} max={40} onChange={(value) => setDimension("d", value)} />
                </div>
              )}

              <div className="flex min-h-[300px] items-end justify-center px-0 pb-0 pt-2.5">
                <div className="flex max-w-full flex-col items-center">
                  {isBackpack ? (
                    /* ── Backpack: the quick-access personal item ── */
                    <div className="relative max-w-full" style={{ width: caseW }}>
                      {/* shoulder straps arcing up over the top */}
                      <div className="absolute left-[20%] top-[-14px] z-0 h-[34px] w-[17px] rounded-t-[14px] border-[3px] border-b-0 border-nav-deep bg-[#1b2c44]" />
                      <div className="absolute right-[20%] top-[-14px] z-0 h-[34px] w-[17px] rounded-t-[14px] border-[3px] border-b-0 border-nav-deep bg-[#1b2c44]" />
                      {/* haul handle */}
                      <div className="relative z-10 mx-auto h-[15px] w-12 rounded-t-[9px] border-[3px] border-b-0 border-nav-deep" />
                      {/* body */}
                      <div
                        className={(weightOver || volumeOver ? "animate-[ck-shake_.5s_ease-in-out_infinite] " : "") + "relative z-10 max-w-full rounded-[26px_26px_18px_18px] border-[3px] border-nav-deep bg-ink shadow-[0_22px_34px_-22px_rgba(6,12,24,0.65)] transition-[width,height] duration-300"}
                        style={{ height: caseH }}
                      >
                        {/* side compression buckles */}
                        <div className="absolute left-[-2px] top-[42%] h-2 w-3 rounded-sm bg-accent opacity-90" />
                        <div className="absolute right-[-2px] top-[42%] h-2 w-3 rounded-sm bg-accent opacity-90" />
                        {/* main compartment */}
                        <div className="absolute inset-x-[11px] top-[12%] bottom-[33%] flex flex-wrap-reverse content-start justify-center gap-[3px] overflow-hidden rounded-[13px] border-2 border-dashed border-[#d8cebb] bg-[#fbf6ea] p-[5px]">
                          {packedGridChildren}
                        </div>
                        {/* front pocket */}
                        <div className="absolute inset-x-[19%] bottom-[10px] top-[70%] rounded-[9px_9px_14px_14px] border-2 border-nav-deep bg-[#1b2c44]">
                          <div className="absolute left-1/2 top-[6px] h-2.5 w-4 -translate-x-1/2 rounded-[3px] bg-accent opacity-90" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Hard-shell checked / cabin case ── */
                    <>
                      <div className="relative z-10 h-[18px] w-16 rounded-t-[10px] border-4 border-b-0 border-nav-deep" />
                      <div className="-mt-[16px] h-10 max-w-full transition-[width] duration-300" style={{ width: caseW, perspective: 220 }}>
                        <div className="h-full w-full origin-bottom rounded-[14px_14px_6px_6px] border-[3px] border-nav-deep bg-[#1b2c44] shadow-[inset_0_-8px_0_rgba(255,255,255,0.07)]" style={{ transform: "rotateX(58deg)" }} />
                      </div>
                      <div
                        className={(weightOver || volumeOver ? "animate-[ck-shake_.5s_ease-in-out_infinite] " : "") + "relative max-w-full rounded-2xl border-[3px] border-nav-deep bg-ink shadow-[0_22px_34px_-22px_rgba(6,12,24,0.65)] transition-[width,height] duration-300"}
                        style={{ width: caseW, height: caseH }}
                      >
                        <div className="absolute bottom-0 left-[14%] top-0 w-[9px] bg-accent opacity-90" />
                        <div className="absolute bottom-0 right-[14%] top-0 w-[9px] bg-accent opacity-90" />
                        <div className="absolute inset-[9px] flex flex-wrap-reverse content-start justify-center gap-[3px] overflow-hidden rounded-[10px] border-2 border-dashed border-[#d8cebb] bg-[#fbf6ea] p-[5px]">
                          {packedGridChildren}
                        </div>
                      </div>
                      <div className="mt-[-3px] flex max-w-full justify-between px-[22px] transition-[width] duration-300" style={{ width: caseW }}>
                        <span className="h-4 w-4 rounded-full bg-nav-deep" />
                        <span className="h-4 w-4 rounded-full bg-nav-deep" />
                      </div>
                    </>
                  )}
                  <div className="mt-3 font-mono text-[10.5px] tracking-[0.12em] text-mono-muted">
                    {def.label} · {config.w} × {config.h} × {config.d} cm · {Math.round(capacity)} L usable
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3" data-tour="weighin-meters">
                <Metric label="WEIGHT" value={kg} limit={def.limitKg} unit="kg" />
                <Metric label="SPACE" value={packedVolume} limit={capacity} unit="L" round />
              </div>
              {(weightOver || volumeOver) && (
                <p className="m-0 text-[13px] font-semibold text-over">
                  {weightOver
                    ? `Over the airline limit by ${(kg - def.limitKg).toFixed(1)} kg — take something out.`
                    : "Out of space — pick a bigger case or unpack something."}
                </p>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
          <ClassicColumn
            title="Unpacked"
            lines={tray}
            onDrop={(event) => onDrop(event, undefined)}
            onMoveAll={assignBag}
            bagId=""
            activeBags={activeBags}
            setUnits={setUnits}
            qtyFor={qtyFor}
          />
          {activeBags.map((id) => {
            const bag = bagDef(id);
            return (
              <ClassicColumn
                key={id}
                title={bag.label}
                lines={perBag[id] ?? []}
                limitKg={bag.limitKg}
                config={bagConfig[id]}
                onDrop={(event) => onDrop(event, id)}
                onMoveAll={assignBag}
                bagId={id}
                activeBags={activeBags}
                setUnits={setUnits}
                qtyFor={qtyFor}
              />
            );
          })}
        </div>
      )}

      <Tour steps={STEPS_WEIGHIN} open={tour.open} onClose={tour.close} />
    </div>
  );
}

function ViewButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={active ? "h-8 rounded-full border border-nav-deep bg-ink px-3.5 text-[12.5px] font-semibold text-accent" : "h-8 rounded-full border border-field-border bg-card px-3.5 text-[12.5px] font-semibold text-ink-muted"}>{children}</button>;
}

function Dimension({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5 font-mono text-[10px] tracking-[0.14em] text-mono-muted">
      <span>{label} · {value} CM</span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-accent" />
    </label>
  );
}

function Metric({ label, value, limit, unit, round = false }: { label: string; value: number; limit: number; unit: string; round?: boolean }) {
  const display = round ? `${value.toFixed(0)} / ${Math.round(limit)} ${unit}` : `${value.toFixed(1)} / ${limit} ${unit}`;
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-card-border bg-field px-3.5 py-3">
      <div className="flex justify-between font-mono text-[10px] tracking-[0.16em] text-mono-muted">
        <span>{label}</span><span className={value > limit ? "text-over" : ""}>{display}</span>
      </div>
      <Meter value={value} limit={limit} />
    </div>
  );
}

function ClassicColumn({
  title,
  lines,
  limitKg,
  config,
  onDrop,
  onMoveAll,
  bagId,
  activeBags,
  setUnits,
  qtyFor,
}: {
  title: string;
  lines: BagLine[];
  limitKg?: number;
  config?: BagConfig;
  onDrop: (event: React.DragEvent) => void;
  onMoveAll: (id: string, bag: BagId | undefined) => void;
  bagId: BagId | "";
  activeBags: BagId[];
  setUnits: (id: string, bag: BagId, units: number) => void;
  qtyFor: (id: string) => number;
}) {
  const kg = lines.reduce((sum, line) => sum + line.kg, 0);
  const volume = lines.reduce((sum, line) => sum + line.volL, 0);
  const capacity = config ? ((config.w * config.h * config.d) / 1000) * 0.85 : 0;
  const over = limitKg !== undefined && kg > limitKg;
  const volumeOver = Boolean(config && volume > capacity);
  const preset = PRESETS.find((candidate) => candidate.id === config?.preset);
  return (
    <div onDrop={onDrop} onDragOver={(event) => event.preventDefault()} className="flex min-h-[220px] flex-col gap-2.5 rounded-[14px] border border-card-border bg-panel p-3.5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2"><span className="font-display text-[15px] font-bold">{title}</span>{limitKg !== undefined && <span className={over ? "font-mono text-[12px] text-over" : "font-mono text-[12px] text-mono-muted"}>{kg.toFixed(1)}/{limitKg} kg</span>}</div>
        {limitKg !== undefined && <><Meter value={kg} limit={limitKg} /><Meter value={volume} limit={capacity} className="h-[5px]" /><div className="flex justify-between gap-2 font-mono text-[9.5px] tracking-[0.1em] text-[#a79e8b]"><span>SPACE {volume.toFixed(0)}/{Math.round(capacity)} L</span><span>{preset?.label.toUpperCase()}</span></div></>}
        {(over || volumeOver) && <p className="m-0 text-[12px] font-semibold text-over">{over ? `Over by ${(kg - (limitKg ?? 0)).toFixed(1)} kg — offload something.` : "Out of space — bigger case or unpack."}</p>}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {lines.map((line) => {
          const total = qtyFor(line.item.id);
          const warning = bagId ? placementWarning(line.item, bagId) : null;
          return (
            <div key={line.item.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", line.item.id)} className="cursor-grab rounded-[9px] border border-card-border bg-card px-2.5 py-2 active:cursor-grabbing">
              <div className="flex items-center gap-2"><ItemIcon item={line.item} size={20} /><span className="min-w-0 flex-1 truncate text-[13px] font-medium">{line.item.name}</span><span className="shrink-0 font-mono text-[11px] text-mono-muted">{line.units > 1 ? `×${line.units} · ` : ""}{line.kg.toFixed(1)} kg</span></div>
              {warning && <p className="m-0 mt-1 text-[11px] font-semibold text-[#b23127]">⚠ {warning}</p>}
              {bagId && total > 1 && (
                <div className="mt-[7px] flex items-center gap-1.5 font-mono text-[10.5px] text-ink-muted">
                  <span className="tracking-[0.08em]">HERE</span>
                  <button type="button" aria-label={`Fewer ${line.item.name} in ${title}`} onClick={() => setUnits(line.item.id, bagId, line.units - 1)} className="grid h-6 w-6 place-items-center rounded border border-field-border bg-field hover:bg-divider">−</button>
                  <span className="w-8 text-center text-ink">{line.units}/{total}</span>
                  <button type="button" aria-label={`More ${line.item.name} in ${title}`} onClick={() => setUnits(line.item.id, bagId, line.units + 1)} className="grid h-6 w-6 place-items-center rounded border border-field-border bg-field hover:bg-divider">+</button>
                </div>
              )}
              <select value={bagId} onChange={(event) => onMoveAll(line.item.id, (event.target.value || undefined) as BagId | undefined)} className="mt-[7px] w-full cursor-pointer rounded-md border border-card-border bg-field px-2 py-1 font-mono text-[10.5px] text-ink-muted" aria-label={`Move all ${line.item.name}`}>
                <option value="">◦ Unpacked (all)</option>
                {activeBags.map((id) => (
                  <option key={id} value={id}>→ {bagDef(id).label} (all)</option>
                ))}
              </select>
            </div>
          );
        })}
        {lines.length === 0 && <div className="grid min-h-[60px] flex-1 place-items-center rounded-[9px] border border-dashed border-[#d8cebb] font-mono text-[11px] tracking-[0.1em] text-[#a79e8b]">DROP ITEMS HERE</div>}
      </div>
    </div>
  );
}
