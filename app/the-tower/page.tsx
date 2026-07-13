"use client";

import { useState } from "react";
import { HOLD } from "@/lib/hold";
import { searchHold } from "@/lib/guidance";
import type { HoldItem } from "@/lib/types";
import { VerdictBadge } from "@/components/ui/verdict-badge";

const EXAMPLES = [
  "Should I bring a pressure cooker?",
  "What about winter jacket for a cold place?",
  "Can I carry rice and spices?",
  "What documents must I pack?",
];

export default function TheTower() {
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [results, setResults] = useState<HoldItem[]>([]);

  function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setAsked(trimmed);
    setResults(searchHold(HOLD, trimmed));
    setQuery("");
  }

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-5">
      <div>
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          GATE D7 · CK 04 · ATC
        </div>
        <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
          The Tower
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          Ask anything about packing, customs, or bring-vs-buy. Answers are
          grounded in The Hold — our community-backed corpus.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(query); }} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask the Tower…"
          className="h-[50px] flex-1 rounded-[10px] border border-field-border bg-card px-4 text-[15px] text-ink shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)] outline-none focus-visible:border-primary"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="h-[50px] rounded-[10px] bg-primary px-[26px] text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      {!asked && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => ask(ex)}
              className="rounded-full border border-field-border bg-card px-3.5 py-2 text-[13px] text-ink-muted hover:bg-divider"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {asked && (
        <div className="flex flex-col gap-3.5">
          <p className="m-0 text-[14px]">
            <span className="text-mono-muted">You asked:</span>{" "}
            <span className="font-semibold">{asked}</span>
          </p>

          {results.length === 0 ? (
            <p className="m-0 rounded-[14px] border border-card-border bg-card p-4 text-[14px] leading-[1.55] text-ink-muted">
              The Hold doesn&apos;t have a confident answer on that yet. As
              students Debrief after arriving, coverage grows — and a live AI
              assistant will handle open questions in a later version.
            </p>
          ) : (
            results.map((h) => (
              <div
                key={h.item}
                className="flex flex-col gap-2.5 rounded-[14px] border border-card-border bg-card p-4 shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <span className="font-display text-[17px] font-bold capitalize">
                    {h.item}
                  </span>
                  <VerdictBadge verdict={h.verdict} contested={h.contested} />
                </div>
                <p className="m-0 text-[14px] leading-[1.55] text-ink-muted">
                  {h.detail}
                </p>
                <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#a79e8b]">
                  Confidence {h.confidence}
                  {h.claimIds?.length
                    ? ` · grounded in ${h.claimIds.length} source${h.claimIds.length > 1 ? "s" : ""} from The Hold`
                    : ""}
                </p>
              </div>
            ))
          )}

          <p className="m-0 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-[#a79e8b]">
            Local retrieval over The Hold · routed-RAG + Claude API plugs in here
          </p>
        </div>
      )}
    </div>
  );
}
