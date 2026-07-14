"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { PACKING_ITEMS } from "@/lib/packing-items";
import {
  BAGS,
  allocatedUnits,
  type BagId,
  type Category,
  type PackingItem,
} from "@/lib/types";
import {
  bagSpecsFrom,
  computeLoadsheet,
  placementWarning,
  unitVolumeL,
  type LoadsheetNote,
} from "@/lib/loadsheet";
import { Meter } from "@/components/ui/meter";

const byId = new Map(PACKING_ITEMS.map((item) => [item.id, item]));

/** Units of one item inside one bag (or the tray). */
interface BagLine {
  item: PackingItem;
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
};

function rotationFor(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 97;
  return (hash % 13) - 6;
}

export default function WeighIn() {
  const { list, alloc, qtyFor, assignBag, setUnits, applyLoadsheet, hydrated } =
    useApp();
  const [view, setView] = useState<"case" | "classic">("case");
  const [activeBag, setActiveBag] = useState<BagId>("bag1");
  const [bagConfig, setBagConfig] = useState<Record<BagId, BagConfig>>(DEFAULT_CONFIG);
  const [notes, setNotes] = useState<LoadsheetNote[] | null>(null);

  const items = useMemo(
    () =>
      list
        .map((id) => byId.get(id))
        .filter((item): item is PackingItem => Boolean(item)),
    [list],
  );

  const { perBag, tray, violations, totalPackedKg } = useMemo(() => {
    const perBag: Record<BagId, BagLine[]> = { bag1: [], bag2: [], cabin: [] };
    const tray: BagLine[] = [];
    const violations: string[] = [];
    let totalPackedKg = 0;
    for (const item of items) {
      const qty = qtyFor(item.id);
      const a = alloc[item.id] ?? {};
      for (const bagId of ["bag1", "bag2", "cabin"] as BagId[]) {
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
      const unassigned = qty - allocatedUnits(a);
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
  }, [items, alloc, qtyFor]);

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

  const bag = BAGS.find((candidate) => candidate.id === activeBag) ?? BAGS[0];
  const config = bagConfig[activeBag];
  const packedLines = perBag[activeBag];
  const kg = packedLines.reduce((sum, line) => sum + line.kg, 0);
  const packedVolume = packedLines.reduce((sum, line) => sum + line.volL, 0);
  const capacity = ((config.w * config.h * config.d) / 1000) * 0.85;
  const weightOver = kg > bag.limitKg;
  const volumeOver = packedVolume > capacity;
  const caseW = Math.round(Math.min(320, Math.max(120, config.w * 3.4)));
  const caseH = Math.round(Math.min(320, Math.max(120, config.h * 3.6)));

  function runAutoPack() {
    const lines = items.map((item) => ({ item, qty: qtyFor(item.id) }));
    const dims = {
      bag1: bagConfig.bag1,
      bag2: bagConfig.bag2,
      cabin: bagConfig.cabin,
    };
    const result = computeLoadsheet(lines, bagSpecsFrom(dims));
    applyLoadsheet(result.alloc);
    setNotes(result.notes);
  }

  function setPreset(presetId: string) {
    const preset = PRESETS.find((candidate) => candidate.id === presetId);
    setBagConfig((current) => ({
      ...current,
      [activeBag]: preset && "w" in preset
        ? { preset: presetId, w: preset.w, h: preset.h, d: preset.d }
        : { ...current[activeBag], preset: presetId },
    }));
  }

  function setDimension(key: "w" | "h" | "d", value: number) {
    setBagConfig((current) => ({
      ...current,
      [activeBag]: { ...current[activeBag], preset: "custom", [key]: value },
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
          <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
            GATE C2 · CK 03 · BAGGAGE LAB
          </div>
          <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">Weigh-In</h1>
          <p className="mt-1.5 max-w-[520px] text-[14.5px] text-ink-muted">
            Hit Auto-Pack to get an optimal, rule-aware loadsheet — or pack by hand. Tap items to move them; the meters track weight and space live.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
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

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="mr-1 font-mono text-[10px] tracking-[0.16em] text-mono-muted">VIEW</span>
        <ViewButton active={view === "case"} onClick={() => setView("case")}>Suitcase</ViewButton>
        <ViewButton active={view === "classic"} onClick={() => setView("classic")}>Classic list</ViewButton>
      </div>

      {view === "case" ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Suitcases">
            {BAGS.map((candidate) => {
              const bagKg = perBag[candidate.id].reduce((sum, line) => sum + line.kg, 0);
              const active = activeBag === candidate.id;
              const over = bagKg > candidate.limitKg;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveBag(candidate.id)}
                  className={active
                    ? "h-10 rounded-full border border-nav-deep bg-ink px-4 text-[13.5px] font-semibold text-nav-text"
                    : "h-10 rounded-full border border-field-border bg-card px-4 text-[13.5px] font-semibold text-ink-muted"}
                >
                  {candidate.label}
                  <span className={over
                    ? "ml-2 font-mono text-[10.5px] text-[#f08a7f]"
                    : active
                      ? "ml-2 font-mono text-[10.5px] text-accent"
                      : "ml-2 font-mono text-[10.5px] text-mono-muted"}
                  >
                    {bagKg.toFixed(1)}/{candidate.limitKg} kg
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid items-stretch gap-[18px] lg:grid-cols-[minmax(280px,1fr)_minmax(360px,1.5fr)]">
            <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-card-border bg-panel p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="m-0 font-display text-[16px] font-bold">Tray</h2>
                <span className="font-mono text-[10px] tracking-[0.14em] text-mono-muted">
                  {tray.length} UNPACKED
                </span>
              </div>
              <p className="m-0 text-[12.5px] text-ink-muted">
                Tap an item to pack it into <strong>{bag.label}</strong>. Tap a packed item to take it back out.
              </p>
              {tray.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2">
                  {tray.map((line) => (
                    <button
                      key={line.item.id}
                      type="button"
                      title={`Pack into ${bag.label}`}
                      onClick={() =>
                        setUnits(
                          line.item.id,
                          activeBag,
                          (alloc[line.item.id]?.[activeBag] ?? 0) + line.units,
                        )
                      }
                      className="relative flex flex-col items-center gap-1.5 rounded-[10px] border border-card-border bg-card px-2 py-2.5"
                    >
                      {line.units > 1 && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-ink px-1.5 py-0.5 font-mono text-[9px] font-bold text-nav-text">
                          ×{line.units}
                        </span>
                      )}
                      <CategoryIcon category={line.item.category} size={32} />
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
                <span className="mr-1 font-mono text-[10px] tracking-[0.16em] text-mono-muted">LUGGAGE</span>
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
                  <div className="h-[18px] w-16 rounded-t-[10px] border-4 border-b-0 border-nav-deep" />
                  <div className="h-10 max-w-full transition-[width] duration-300" style={{ width: caseW, perspective: 220 }}>
                    <div className="h-full w-full origin-bottom rounded-[14px_14px_6px_6px] border-[3px] border-nav-deep bg-[#1b2c44] shadow-[inset_0_-8px_0_rgba(255,255,255,0.07)]" style={{ transform: "rotateX(58deg)" }} />
                  </div>
                  <div
                    className={weightOver || volumeOver ? "relative max-w-full animate-[ck-shake_.5s_ease-in-out_infinite] rounded-2xl border-[3px] border-nav-deep bg-ink shadow-[0_22px_34px_-22px_rgba(6,12,24,0.65)] transition-[width,height] duration-300" : "relative max-w-full rounded-2xl border-[3px] border-nav-deep bg-ink shadow-[0_22px_34px_-22px_rgba(6,12,24,0.65)] transition-[width,height] duration-300"}
                    style={{ width: caseW, height: caseH }}
                  >
                    <div className="absolute bottom-0 left-[14%] top-0 w-[9px] bg-accent opacity-90" />
                    <div className="absolute bottom-0 right-[14%] top-0 w-[9px] bg-accent opacity-90" />
                    <div className="absolute inset-[9px] flex flex-wrap-reverse content-start justify-center gap-[3px] overflow-hidden rounded-[10px] border-2 border-dashed border-[#d8cebb] bg-[#fbf6ea] p-[5px]">
                      {packedLines.length > 0 ? packedLines.map((line) => {
                        const size = Math.round(Math.min(Math.min(caseW, caseH) * 0.42, Math.max(26, Math.sqrt(line.volL) * 15)));
                        return (
                          <button
                            key={line.item.id}
                            type="button"
                            title={`${line.item.name}${line.units > 1 ? ` ×${line.units}` : ""} · ${line.kg.toFixed(1)} kg — tap to unpack`}
                            onClick={() => setUnits(line.item.id, activeBag, 0)}
                            className="relative grid place-items-center rounded-lg border-2 border-card-border bg-card animate-[ck-drop_.45s_cubic-bezier(.2,.8,.3,1.15)]"
                            style={{ width: size, height: size, transform: `rotate(${rotationFor(line.item.id)}deg)` }}
                          >
                            {line.units > 1 && (
                              <span className="absolute right-0.5 top-0.5 rounded-full bg-ink px-1 py-px font-mono text-[8px] font-bold text-nav-text">
                                ×{line.units}
                              </span>
                            )}
                            <CategoryIcon category={line.item.category} size={Math.round(size * 0.7)} />
                          </button>
                        );
                      }) : (
                        <div className="grid h-full w-full place-items-center text-center font-mono text-[10px] leading-[1.8] tracking-[0.12em] text-[#a79e8b]">
                          TAP TRAY ITEMS<br />TO PACK — OR ✈ AUTO-PACK
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-[-3px] flex max-w-full justify-between px-[22px] transition-[width] duration-300" style={{ width: caseW }}>
                    <span className="h-4 w-4 rounded-full bg-nav-deep" />
                    <span className="h-4 w-4 rounded-full bg-nav-deep" />
                  </div>
                  <div className="mt-3 font-mono text-[10.5px] tracking-[0.12em] text-mono-muted">
                    {config.w} × {config.h} × {config.d} cm · {Math.round(capacity)} L usable
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                <Metric label="WEIGHT" value={kg} limit={bag.limitKg} unit="kg" />
                <Metric label="SPACE" value={packedVolume} limit={capacity} unit="L" round />
              </div>
              {(weightOver || volumeOver) && (
                <p className="m-0 text-[13px] font-semibold text-over">
                  {weightOver
                    ? `Over the airline limit by ${(kg - bag.limitKg).toFixed(1)} kg — take something out.`
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
            setUnits={setUnits}
            qtyFor={qtyFor}
          />
          {BAGS.map((candidate) => (
            <ClassicColumn
              key={candidate.id}
              title={candidate.label}
              lines={perBag[candidate.id]}
              limitKg={candidate.limitKg}
              config={bagConfig[candidate.id]}
              onDrop={(event) => onDrop(event, candidate.id)}
              onMoveAll={assignBag}
              bagId={candidate.id}
              setUnits={setUnits}
              qtyFor={qtyFor}
            />
          ))}
        </div>
      )}
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
              <div className="flex items-center gap-2"><CategoryIcon category={line.item.category} size={20} /><span className="min-w-0 flex-1 truncate text-[13px] font-medium">{line.item.name}</span><span className="shrink-0 font-mono text-[11px] text-mono-muted">{line.units > 1 ? `×${line.units} · ` : ""}{line.kg.toFixed(1)} kg</span></div>
              {warning && <p className="m-0 mt-1 text-[11px] font-semibold text-[#b23127]">⚠ {warning}</p>}
              {bagId && total > 1 && (
                <div className="mt-[7px] flex items-center gap-1.5 font-mono text-[10.5px] text-ink-muted">
                  <span className="tracking-[0.08em]">HERE</span>
                  <button type="button" aria-label={`Fewer ${line.item.name} in ${title}`} onClick={() => setUnits(line.item.id, bagId, line.units - 1)} className="grid h-6 w-6 place-items-center rounded border border-field-border bg-field hover:bg-divider">−</button>
                  <span className="w-8 text-center text-ink">{line.units}/{total}</span>
                  <button type="button" aria-label={`More ${line.item.name} in ${title}`} onClick={() => setUnits(line.item.id, bagId, line.units + 1)} className="grid h-6 w-6 place-items-center rounded border border-field-border bg-field hover:bg-divider">+</button>
                </div>
              )}
              <select value={bagId} onChange={(event) => onMoveAll(line.item.id, (event.target.value || undefined) as BagId | undefined)} className="mt-[7px] w-full cursor-pointer rounded-md border border-card-border bg-field px-2 py-1 font-mono text-[10.5px] text-ink-muted" aria-label={`Move all ${line.item.name}`}><option value="">◦ Unpacked (all)</option><option value="bag1">→ Checked Bag 1 (all)</option><option value="bag2">→ Checked Bag 2 (all)</option><option value="cabin">→ Cabin (all)</option></select>
            </div>
          );
        })}
        {lines.length === 0 && <div className="grid min-h-[60px] flex-1 place-items-center rounded-[9px] border border-dashed border-[#d8cebb] font-mono text-[11px] tracking-[0.1em] text-[#a79e8b]">DROP ITEMS HERE</div>}
      </div>
    </div>
  );
}

function CategoryIcon({ category, size }: { category: Category; size: number }) {
  const common = { width: size, height: size, viewBox: "0 0 48 48", className: "shrink-0" };
  const outline = "#14202e";
  if (category === "documents") return <svg {...common}><rect x="11" y="7" width="26" height="34" rx="4" fill="#1466d8" stroke={outline} strokeWidth="2.5" /><circle cx="24" cy="19" r="6" fill="#f5a623" stroke={outline} strokeWidth="2" /><path d="M17 32h14" stroke="#fbf6ea" strokeWidth="2.5" strokeLinecap="round" /></svg>;
  if (category === "clothing") return <svg {...common}><path d="M17 10 22 7h4l5 3 8 6-5 6-3-2v20H15V20l-3 2-5-6z" fill="#4fcb8b" stroke={outline} strokeWidth="2.5" strokeLinejoin="round" /><path d="M20 8c1 4 7 4 8 0" fill="none" stroke={outline} strokeWidth="2.5" strokeLinecap="round" /></svg>;
  if (category === "kitchen") return <svg {...common}><circle cx="24" cy="11" r="3" fill="#f5a623" stroke={outline} strokeWidth="2" /><ellipse cx="24" cy="18" rx="14" ry="4.5" fill="#8fa3c4" stroke={outline} strokeWidth="2.5" /><path d="M10 18v10c0 6 6 10 14 10s14-4 14-10V18" fill="#8fa3c4" stroke={outline} strokeWidth="2.5" strokeLinejoin="round" /></svg>;
  if (category === "food") return <svg {...common}><rect x="13" y="8" width="22" height="7" rx="2.5" fill={outline} stroke={outline} strokeWidth="2.5" /><path d="M15 15h18v20a5 5 0 0 1-5 5h-8a5 5 0 0 1-5-5z" fill="#f5a623" stroke={outline} strokeWidth="2.5" /><rect x="19" y="22" width="10" height="9" rx="2" fill="#fbf6ea" stroke={outline} strokeWidth="2" /></svg>;
  if (category === "medicines") return <svg {...common}><rect x="8" y="13" width="32" height="26" rx="5" fill="#fbf6ea" stroke={outline} strokeWidth="2.5" /><path d="M18 13v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" fill="none" stroke={outline} strokeWidth="2.5" /><path d="M21 21h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="#d23b2e" stroke={outline} strokeWidth="2" /></svg>;
  if (category === "electronics") return <svg {...common}><rect x="11" y="9" width="26" height="18" rx="3" fill={outline} stroke={outline} strokeWidth="2.5" /><rect x="14" y="12" width="20" height="12" rx="1.5" fill="#1466d8" /><path d="m8 33 3-6h26l3 6a3 3 0 0 1-3 4H11a3 3 0 0 1-3-4z" fill="#8fa3c4" stroke={outline} strokeWidth="2.5" /></svg>;
  if (category === "bedding") return <svg {...common}><path d="M10 14c8-4 20-4 28 0-2 8-2 12 0 20-8 4-20 4-28 0 2-8 2-12 0-20z" fill="#e7f0fb" stroke={outline} strokeWidth="2.5" /><path d="M16 20c5-2 11-2 16 0" fill="none" stroke="#8fa3c4" strokeWidth="2.5" strokeLinecap="round" /></svg>;
  if (category === "toiletries") return <svg {...common}><rect x="19" y="6" width="10" height="7" rx="2" fill={outline} stroke={outline} strokeWidth="2" /><path d="M17 15h14v20a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z" fill="#1257b8" stroke={outline} strokeWidth="2.5" /><rect x="20" y="22" width="8" height="8" rx="2" fill="#fbf6ea" /></svg>;
  if (category === "money") return <svg {...common}><rect x="7" y="13" width="34" height="22" rx="4" fill="#147a48" stroke={outline} strokeWidth="2.5" /><path d="M7 18h34v5H7z" fill={outline} /><rect x="12" y="27" width="12" height="4" rx="1.5" fill="#fbf6ea" /></svg>;
  return <svg {...common}><rect x="9" y="12" width="30" height="26" rx="4" fill="#e4dccb" stroke={outline} strokeWidth="2.5" /></svg>;
}
