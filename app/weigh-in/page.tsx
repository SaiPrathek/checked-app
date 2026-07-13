"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { PACKING_ITEMS } from "@/lib/packing-items";
import { BAGS, type BagId, type PackingItem } from "@/lib/types";
import { Meter } from "@/components/ui/meter";

const byId = new Map(PACKING_ITEMS.map((i) => [i.id, i]));

export default function WeighIn() {
  const { list, bags, assignBag, hydrated } = useApp();

  const listedItems = useMemo(
    () => list.map((id) => byId.get(id)).filter((x): x is PackingItem => !!x),
    [list],
  );

  const columns = useMemo(() => {
    const unassigned = listedItems.filter((it) => !bags[it.id]);
    const perBag: Record<BagId, PackingItem[]> = { bag1: [], bag2: [], cabin: [] };
    for (const it of listedItems) {
      const b = bags[it.id];
      if (b) perBag[b].push(it);
    }
    return { unassigned, perBag };
  }, [listedItems, bags]);

  const totalKg = listedItems.reduce((s, it) => s + it.weightKg, 0);

  if (!hydrated)
    return <p className="font-mono text-xs text-mono-muted">LOADING…</p>;

  if (listedItems.length === 0) {
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
    if (id) assignBag(id, bag);
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
            {columns.unassigned.length} UNPACKED
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
        <Column
          title="Unpacked"
          items={columns.unassigned}
          onDrop={(e) => onDrop(e, undefined)}
          onAssign={assignBag}
          currentBag=""
        />
        {BAGS.map((bag) => {
          const items = columns.perBag[bag.id];
          const kg = items.reduce((s, it) => s + it.weightKg, 0);
          return (
            <Column
              key={bag.id}
              title={bag.label}
              limitKg={bag.limitKg}
              kg={kg}
              items={items}
              onDrop={(e) => onDrop(e, bag.id)}
              onAssign={assignBag}
              currentBag={bag.id}
            />
          );
        })}
      </div>
    </div>
  );
}

function Column({
  title,
  items,
  kg,
  limitKg,
  onDrop,
  onAssign,
  currentBag,
}: {
  title: string;
  items: PackingItem[];
  kg?: number;
  limitKg?: number;
  onDrop: (e: React.DragEvent) => void;
  onAssign: (id: string, bag: BagId | undefined) => void;
  currentBag: BagId | "";
}) {
  const showMeter = limitKg !== undefined;
  const limit = limitKg ?? 0;
  const packed = kg ?? 0;
  const over = showMeter && packed > limit;
  const near = showMeter && !over && packed > limit * 0.9;
  const numColor = over ? "text-over" : near ? "text-[#9a5b00]" : "text-mono-muted";
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="flex min-h-[220px] flex-col gap-2.5 rounded-[14px] border border-card-border bg-panel p-3.5"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-[15px] font-bold">{title}</span>
          {showMeter && (
            <span className={`font-mono text-[12px] ${numColor}`}>
              {packed.toFixed(1)}/{limit}
            </span>
          )}
        </div>
        {showMeter && <Meter value={packed} limit={limit} />}
        {over && (
          <p className="m-0 text-[12px] font-semibold text-over">
            Over by {(packed - limit).toFixed(1)} kg — offload something.
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {items.map((it) => (
          <div
            key={it.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", it.id)}
            className="cursor-grab rounded-[9px] border border-card-border bg-card p-2.5 shadow-[0_1px_0_rgba(0,0,0,0.03)] active:cursor-grabbing"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[13px] font-medium">
                {it.name}
              </span>
              <span className="flex-shrink-0 font-mono text-[11px] text-mono-muted">
                {it.weightKg.toFixed(1)}
              </span>
            </div>
            <select
              value={currentBag}
              onChange={(e) =>
                onAssign(it.id, (e.target.value || undefined) as BagId | undefined)
              }
              className="mt-[7px] w-full cursor-pointer appearance-none rounded-[6px] border border-card-border bg-field px-2 py-1 font-mono text-[10.5px] tracking-[0.04em] text-ink-muted"
              aria-label={`Move ${it.name}`}
            >
              <option value="">◦ Unpacked</option>
              <option value="bag1">→ Checked Bag 1</option>
              <option value="bag2">→ Checked Bag 2</option>
              <option value="cabin">→ Cabin</option>
            </select>
          </div>
        ))}
        {items.length === 0 && (
          <div className="grid min-h-[60px] flex-1 place-items-center rounded-[9px] border border-dashed border-[#d8cebb] font-mono text-[11px] tracking-[0.1em] text-[#a79e8b]">
            DROP ITEMS HERE
          </div>
        )}
      </div>
    </div>
  );
}
