"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { PACKING_ITEMS } from "@/lib/packing-items";
import { BAGS, type BagId, type PackingItem } from "@/lib/types";
import { Meter } from "@/components/ui/meter";

const byId = new Map(PACKING_ITEMS.map((i) => [i.id, i]));

/** A listed item paired with the user's chosen qty — the actual weighing unit. */
interface Line {
  item: PackingItem;
  qty: number;
  /** total weight for the line = item.weightKg * qty */
  kg: number;
}

type BagView = "unassigned" | BagId;

export default function WeighIn() {
  const { list, bags, assignBag, qtyFor, hydrated } = useApp();
  const [activeView, setActiveView] = useState<BagView>("unassigned");

  const lines = useMemo<Line[]>(
    () =>
      list
        .map((id) => {
          const item = byId.get(id);
          if (!item) return null;
          const qty = qtyFor(id);
          return { item, qty, kg: item.weightKg * qty };
        })
        .filter((x): x is Line => !!x),
    [list, qtyFor],
  );

  const columns = useMemo(() => {
    const unassigned = lines.filter((l) => !bags[l.item.id]);
    const perBag: Record<BagId, Line[]> = { bag1: [], bag2: [], cabin: [] };
    for (const l of lines) {
      const b = bags[l.item.id];
      if (b) perBag[b].push(l);
    }
    return { unassigned, perBag };
  }, [lines, bags]);

  const totalKg = lines.reduce((s, l) => s + l.kg, 0);
  const unpackedKg = columns.unassigned.reduce((sum, line) => sum + line.kg, 0);
  const activeBag = BAGS.find((bag) => bag.id === activeView);
  const activeLines = activeView === "unassigned"
    ? columns.unassigned
    : columns.perBag[activeView];
  const activeKg = activeLines.reduce((sum, line) => sum + line.kg, 0);

  if (!hydrated)
    return <p className="font-mono text-xs text-mono-muted">LOADING…</p>;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          GATE C2 · CK 03
        </div>
        <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
          Weigh-In
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-ink-muted">
          Nothing to weigh yet. Add items in The Manifest, then come back to pack
          them into bags.
        </p>
        <Link
          href="/manifest"
          className="mt-5 inline-flex h-11 items-center rounded-[9px] bg-accent px-5 text-[14.5px] font-semibold text-accent-ink"
        >
          Go to The Manifest →
        </Link>
      </div>
    );
  }

  function onDrop(e: React.DragEvent, bag: BagId | undefined) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      assignBag(id, bag);
      setActiveView(bag ?? "unassigned");
    }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
            GATE C2 · CK 03
          </div>
          <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
            Weigh-In
          </h1>
          <p className="mt-1.5 max-w-[520px] text-[14.5px] text-ink-muted">
            Drag items into a bag (or use the menu). Watch the meters — green is
            good, amber is close, red is over the limit.
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[22px] font-bold">
            {totalKg.toFixed(1)} kg
          </div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-mono-muted">
            TOTAL PLANNED · {columns.unassigned.length} UNPACKED
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-card-border bg-[#f6f1e6] px-4 py-3">
        <span className="font-mono text-[10.5px] font-bold tracking-[0.16em] text-mono-muted">
          BAGGAGE ALLOWANCE
        </span>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-ink-muted">
          <span>2 × 23 KG CHECKED</span>
          <span>7 KG CABIN</span>
          <span>53 KG TOTAL</span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Baggage compartments"
        className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "unassigned"}
          aria-controls="bag-workspace"
          onClick={() => setActiveView("unassigned")}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDrop(event, undefined)}
          className={activeView === "unassigned"
            ? "rounded-[14px] border border-nav bg-nav p-4 text-left text-nav-text shadow-[0_14px_28px_-22px_rgba(6,12,24,0.8)]"
            : "rounded-[14px] border border-card-border bg-card p-4 text-left transition-colors hover:border-primary"}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={activeView === "unassigned"
                ? "block font-mono text-[9.5px] tracking-[0.14em] text-nav-muted"
                : "block font-mono text-[9.5px] tracking-[0.14em] text-mono-muted"}
              >
                STAGING AREA
              </span>
              <span className="mt-1 block font-display text-[17px] font-bold">Unpacked</span>
            </div>
            <span className={activeView === "unassigned"
              ? "rounded-full bg-[#ffffff14] px-2.5 py-1 font-mono text-[11px]"
              : "rounded-full bg-panel px-2.5 py-1 font-mono text-[11px] text-ink-muted"}
            >
              {columns.unassigned.length}
            </span>
          </div>
          <div className={activeView === "unassigned"
            ? "mt-4 font-mono text-[20px] font-bold text-accent"
            : "mt-4 font-mono text-[20px] font-bold text-ink"}
          >
            {unpackedKg.toFixed(1)} kg
          </div>
          <div className={activeView === "unassigned"
            ? "mt-1 text-[11.5px] text-nav-muted"
            : "mt-1 text-[11.5px] text-ink-muted"}
          >
            Assign these items to a bag
          </div>
        </button>

        {BAGS.map((bag) => {
          const items = columns.perBag[bag.id];
          const kg = items.reduce((s, l) => s + l.kg, 0);
          const over = kg > bag.limitKg;
          const remaining = Math.abs(bag.limitKg - kg);
          const selected = activeView === bag.id;
          return (
            <button
              key={bag.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="bag-workspace"
              onClick={() => setActiveView(bag.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, bag.id)}
              className={selected
                ? "rounded-[14px] border border-nav bg-nav p-4 text-left text-nav-text shadow-[0_14px_28px_-22px_rgba(6,12,24,0.8)]"
                : "rounded-[14px] border border-card-border bg-card p-4 text-left transition-colors hover:border-primary"}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={selected
                    ? "block font-mono text-[9.5px] tracking-[0.14em] text-nav-muted"
                    : "block font-mono text-[9.5px] tracking-[0.14em] text-mono-muted"}
                  >
                    {bag.id === "cabin" ? "CARRY-ON" : "CHECKED"}
                  </span>
                  <span className="mt-1 block font-display text-[17px] font-bold">{bag.label}</span>
                </div>
                <span className={selected
                  ? "rounded-full bg-[#ffffff14] px-2.5 py-1 font-mono text-[11px]"
                  : "rounded-full bg-panel px-2.5 py-1 font-mono text-[11px] text-ink-muted"}
                >
                  {items.length}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-2">
                <span className={over
                  ? "font-mono text-[20px] font-bold text-over"
                  : selected
                    ? "font-mono text-[20px] font-bold text-accent"
                    : "font-mono text-[20px] font-bold text-ink"}
                >
                  {kg.toFixed(1)} kg
                </span>
                <span className={selected
                  ? "font-mono text-[10.5px] text-nav-muted"
                  : "font-mono text-[10.5px] text-mono-muted"}
                >
                  / {bag.limitKg} kg
                </span>
              </div>
              <Meter value={kg} limit={bag.limitKg} className="mt-2" />
              <div className={over
                ? "mt-2 text-[11.5px] font-semibold text-over"
                : selected
                  ? "mt-2 text-[11.5px] text-nav-muted"
                  : "mt-2 text-[11.5px] text-ink-muted"}
              >
                {over ? `${remaining.toFixed(1)} kg over limit` : `${remaining.toFixed(1)} kg remaining`}
              </div>
            </button>
          );
        })}
      </div>

      <BagWorkspace
        title={activeBag?.label ?? "Unpacked"}
        eyebrow={activeBag ? `${activeBag.limitKg} KG LIMIT` : "STAGING AREA"}
        lines={activeLines}
        kg={activeKg}
        limitKg={activeBag?.limitKg}
        onDrop={(event) => onDrop(event, activeBag?.id)}
        onAssign={assignBag}
        currentBag={activeBag?.id ?? ""}
      />
    </div>
  );
}

function BagWorkspace({
  title,
  eyebrow,
  lines,
  kg,
  limitKg,
  onDrop,
  onAssign,
  currentBag,
}: {
  title: string;
  eyebrow: string;
  lines: Line[];
  kg: number;
  limitKg?: number;
  onDrop: (e: React.DragEvent) => void;
  onAssign: (id: string, bag: BagId | undefined) => void;
  currentBag: BagId | "";
}) {
  const over = limitKg !== undefined && kg > limitKg;
  return (
    <div
      id="bag-workspace"
      role="tabpanel"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="overflow-hidden rounded-[14px] border border-card-border bg-card shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-card-border bg-[#f6f1e6] px-4 py-3.5">
        <div>
          <span className="block font-mono text-[9.5px] font-bold tracking-[0.16em] text-mono-muted">
            {eyebrow}
          </span>
          <h2 className="mt-1 font-display text-[20px] font-bold">{title}</h2>
        </div>
        <div className="text-right">
          <span className={over
            ? "block font-mono text-[18px] font-bold text-over"
            : "block font-mono text-[18px] font-bold text-ink"}
          >
            {kg.toFixed(1)} kg
          </span>
          <span className="font-mono text-[9.5px] tracking-[0.12em] text-mono-muted">
            {lines.length} ITEM{lines.length === 1 ? "" : "S"}
          </span>
        </div>
      </div>

      <div>
        {lines.map((l) => (
          <div
            key={l.item.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", l.item.id)}
            className="grid cursor-grab gap-3 border-t border-divider p-4 first:border-t-0 active:cursor-grabbing sm:grid-cols-[minmax(0,1fr)_auto_190px] sm:items-center"
          >
            <div className="min-w-0">
              <span className="block truncate text-[14px] font-semibold">{l.item.name}</span>
              <span className="mt-0.5 block font-mono text-[10px] tracking-[0.08em] text-mono-muted">
                DRAG TO A BAG ABOVE
              </span>
            </div>
            <span className="whitespace-nowrap font-mono text-[12px] text-ink-muted">
              ×{l.qty} · {l.kg.toFixed(1)} kg
            </span>
            <select
              value={currentBag}
              onChange={(e) =>
                onAssign(l.item.id, (e.target.value || undefined) as BagId | undefined)
              }
              className="h-9 w-full cursor-pointer appearance-none rounded-[7px] border border-field-border bg-field px-2.5 font-mono text-[10.5px] tracking-[0.04em] text-ink-muted"
              aria-label={`Move ${l.item.name}`}
            >
              <option value="">◦ Unpacked</option>
              <option value="bag1">→ Checked Bag 1</option>
              <option value="bag2">→ Checked Bag 2</option>
              <option value="cabin">→ Cabin</option>
            </select>
          </div>
        ))}
        {lines.length === 0 && (
          <div className="grid min-h-[150px] place-items-center p-5 text-center">
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[0.14em] text-[#a79e8b]">
                DROP ITEMS HERE
              </div>
              <p className="mb-0 mt-2 text-[13px] text-ink-muted">
                This compartment is empty.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
