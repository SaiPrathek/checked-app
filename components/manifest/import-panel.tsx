"use client";

import { useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { parseRows, localMatch, MAX_IMPORT_CHARS, type ImportMatch } from "@/lib/import";
import { aiMatchImport } from "@/lib/actions/import";
import type { Category, CustomItem, Verdict } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/labels";

type Status = "idle" | "parsing" | "review" | "applied";
interface Row extends ImportMatch {
  selected: boolean;
}

const PLACEHOLDER = `Paste your list — one item per line. Counts are optional. e.g.

Pressure cooker, 1
5 t-shirts
Winter jacket
towels x2
Spices and masala box`;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";

export function ImportPanel({ onClose }: { onClose: () => void }) {
  const { saveCustomItem, setQtyForItem } = useApp();
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [rows, setRows] = useState<Row[]>([]);
  const [usedAI, setUsedAI] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? "").slice(0, MAX_IMPORT_CHARS));
    reader.onerror = () => setError("Couldn't read that file. Try pasting the list instead.");
    reader.readAsText(file);
  }

  async function parse() {
    const text = raw.trim();
    if (!text) return;
    setStatus("parsing");
    setError(null);
    try {
      let matches = await aiMatchImport(text);
      if (matches === null) {
        // no AI key or the call failed — deterministic local fallback
        matches = localMatch(parseRows(text));
        setUsedAI(false);
      } else {
        setUsedAI(true);
      }
      if (!matches || matches.length === 0) {
        setError("Couldn't find any items in that. Check the format and try again.");
        setStatus("idle");
        return;
      }
      setRows(matches.map((m) => ({ ...m, selected: true })));
      setStatus("review");
    } catch (e) {
      console.error("import parse", e);
      // last-ditch local fallback so the feature never hard-fails
      const local = localMatch(parseRows(text));
      if (local.length) {
        setUsedAI(false);
        setRows(local.map((m) => ({ ...m, selected: true })));
        setStatus("review");
      } else {
        setError("Something went wrong parsing that list. Try pasting fewer items.");
        setStatus("idle");
      }
    }
  }

  function apply() {
    const chosen = rows.filter((r) => r.selected);
    for (const r of chosen) {
      if (r.custom || !r.matchedId) {
        const item: CustomItem = {
          id: `custom:${slugify(r.name)}-${Date.now().toString(36)}-${Math.floor(performance.now())}`,
          name: r.name,
          category: r.category as Category,
          weightKg: Math.max(0.01, r.weightKg ?? 0.3),
          verdict: (r.verdict ?? "either") as Verdict,
          aiFilled: usedAI,
          createdAt: new Date().toISOString(),
        };
        saveCustomItem(item);
        setQtyForItem(item.id, r.qty);
      } else {
        // catalog match — setQtyForItem adds it to the list and sets the count
        setQtyForItem(r.matchedId, r.qty);
      }
    }
    setAppliedCount(chosen.length);
    setStatus("applied");
  }

  const selectedCount = rows.filter((r) => r.selected).length;

  return (
    <div className="flex flex-col gap-3 border-b border-divider bg-[#f6f1e6] p-4">
      {status === "applied" ? (
        <div className="flex flex-col items-start gap-2">
          <p className="m-0 text-[14px] text-ink">
            ✓ Added <strong>{appliedCount}</strong> item{appliedCount === 1 ? "" : "s"} to your
            Manifest. Counts are set — tune anything from the cards below.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[9px] bg-primary px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
          >
            Done
          </button>
        </div>
      ) : status === "review" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mono-muted">
              Review · {rows.length} found{" "}
              {usedAI ? "· matched by Checked AI" : "· matched locally (AI unavailable)"}
            </span>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-muted hover:text-primary"
            >
              ← Edit list
            </button>
          </div>

          <div className="flex flex-col divide-y divide-divider overflow-hidden rounded-[10px] border border-card-border bg-card">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                <input
                  type="checkbox"
                  checked={r.selected}
                  onChange={(e) =>
                    setRows((cur) =>
                      cur.map((x, j) => (j === i ? { ...x, selected: e.target.checked } : x)),
                    )
                  }
                  aria-label={`Include ${r.name}`}
                  className="h-4 w-4 flex-shrink-0 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13.5px] font-medium text-ink">{r.name}</span>
                    <span
                      className={
                        r.custom
                          ? "flex-shrink-0 rounded-full bg-[#eef2fb] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-primary"
                          : "flex-shrink-0 rounded-full bg-[#e8f3ec] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#147a48]"
                      }
                    >
                      {r.custom ? "✦ New" : "✓ Matched"}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-mono-muted">
                    {CATEGORY_LABEL[r.category as Category] ?? r.category}
                    {!r.custom && r.matchedName && r.matchedName !== r.name ? ` · ${r.matchedName}` : ""}
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Fewer ${r.name}`}
                    onClick={() =>
                      setRows((cur) =>
                        cur.map((x, j) => (j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x)),
                      )
                    }
                    className="grid h-6 w-6 place-items-center rounded border border-field-border bg-field text-ink-muted hover:bg-divider"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-[12px] tabular-nums text-ink">{r.qty}</span>
                  <button
                    type="button"
                    aria-label={`More ${r.name}`}
                    onClick={() =>
                      setRows((cur) =>
                        cur.map((x, j) => (j === i ? { ...x, qty: Math.min(99, x.qty + 1) } : x)),
                      )
                    }
                    className="grid h-6 w-6 place-items-center rounded border border-field-border bg-field text-ink-muted hover:bg-divider"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted hover:text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={selectedCount === 0}
              className="rounded-[9px] bg-primary px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              Add {selectedCount} to Manifest
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mono-muted">
              Import a packed list · paste or upload
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-muted hover:text-primary"
            >
              Close
            </button>
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value.slice(0, MAX_IMPORT_CHARS))}
            placeholder={PLACEHOLDER}
            rows={7}
            className="w-full resize-y rounded-[10px] border border-field-border bg-card p-3 text-[13.5px] leading-[1.5] text-ink outline-none focus-visible:border-primary"
          />
          {error && <p className="m-0 text-[12px] text-[#b23127]">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={parse}
              disabled={!raw.trim() || status === "parsing"}
              className="rounded-[9px] bg-primary px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              {status === "parsing" ? "Reading your list…" : "✦ Parse with Checked AI"}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-[9px] border border-field-border bg-card px-3.5 py-2 text-[13px] font-semibold text-ink-muted hover:border-primary hover:text-primary"
            >
              Upload .csv / .txt
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={onFile}
              className="hidden"
            />
            <span className="text-[11px] leading-[1.4] text-ink-muted">
              Excel? Copy the cells and paste, or save as CSV.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
