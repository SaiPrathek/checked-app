"use client";

import { useEffect, useRef, useState } from "react";
import { HOLD } from "@/lib/hold";
import { searchHold } from "@/lib/guidance";
import { useApp } from "@/lib/store";
import type { HoldItem } from "@/lib/types";
import { VerdictBadge } from "@/components/ui/verdict-badge";

const EXAMPLES = [
  "Should I bring a pressure cooker?",
  "What about a winter jacket for a cold place?",
  "Can I carry rice and spices?",
  "What documents must I pack?",
];

type Status = "idle" | "streaming" | "done" | "nokey" | "error" | "nosources";

/** Render the model's inline [n] markers as small accent chips. */
function withCitations(text: string) {
  return text.split(/(\[\d+\])/g).map((part, i) =>
    /^\[\d+\]$/.test(part) ? (
      <sup key={i} className="mx-0.5 font-mono text-[10px] font-semibold text-primary">
        {part}
      </sup>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function TheTower() {
  const { profile } = useApp();
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [sources, setSources] = useState<HoldItem[]>([]);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight stream when the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const found = searchHold(HOLD, trimmed);
    setAsked(trimmed);
    setQuery("");
    setSources(found);
    setAnswer("");

    // No grounding → no generation. Honest "not covered yet" state.
    if (found.length === 0) {
      setStatus("nosources");
      return;
    }

    setStatus("streaming");
    try {
      const res = await fetch("/api/tower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          sourceKeys: found.map((h) => h.item),
          profile,
        }),
        signal: controller.signal,
      });

      if (res.status === 503) {
        setStatus("nokey"); // live answer unavailable — sources still shown
        return;
      }
      if (!res.ok || !res.body) {
        setStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setAnswer(acc);
      }
      setStatus("done");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.error("tower ask", e);
      setStatus("error");
    }
  }

  const streaming = status === "streaming";

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
          generated live and grounded in The Hold — our community-backed corpus.
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
          disabled={!query.trim() || streaming}
          className="h-[50px] rounded-[10px] bg-primary px-[26px] text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {streaming ? "…" : "Ask"}
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

          {status === "nosources" ? (
            <p className="m-0 rounded-[14px] border border-card-border bg-card p-4 text-[14px] leading-[1.55] text-ink-muted">
              The Hold doesn&apos;t have a confident answer on that yet. As
              students Debrief after arriving, coverage grows — try rephrasing,
              or ask about a specific item.
            </p>
          ) : (
            <>
              {/* Synthesized answer */}
              {(answer || streaming) && (
                <div className="rounded-[14px] border border-card-border bg-card p-4 shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mono-muted">
                    The Tower · live answer
                  </div>
                  <p className="m-0 text-[14.5px] leading-[1.6] text-ink">
                    {withCitations(answer)}
                    {streaming && (
                      <span
                        className="ml-0.5 inline-block h-[15px] w-[7px] translate-y-[2px] bg-primary"
                        style={{ animation: "ck-blink 1s steps(1) infinite" }}
                      />
                    )}
                  </p>
                </div>
              )}

              {status === "nokey" && (
                <p className="m-0 rounded-[14px] border border-card-border bg-field p-3.5 text-[13px] leading-[1.5] text-ink-muted">
                  Live answers are paused right now — here&apos;s what The Hold
                  says directly.
                </p>
              )}
              {status === "error" && (
                <p className="m-0 rounded-[14px] border border-card-border bg-field p-3.5 text-[13px] leading-[1.5] text-ink-muted">
                  Couldn&apos;t generate a live answer just now. The grounded
                  sources are below.
                </p>
              )}

              {/* Numbered sources — identical to what grounded the answer */}
              {sources.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mono-muted">
                    Sources from The Hold
                  </div>
                  {sources.map((h, i) => (
                    <div
                      key={h.item}
                      className="flex flex-col gap-2 rounded-[14px] border border-card-border bg-card p-4 shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="flex items-center gap-2 font-display text-[16px] font-bold capitalize">
                          <span className="font-mono text-[11px] font-semibold text-primary">
                            [{i + 1}]
                          </span>
                          {h.item}
                        </span>
                        <VerdictBadge verdict={h.verdict} contested={h.contested} />
                      </div>
                      <p className="m-0 text-[13.5px] leading-[1.55] text-ink-muted">
                        {h.detail}
                      </p>
                      <p className="m-0 font-mono text-[10px] uppercase tracking-[0.06em] text-[#a79e8b]">
                        Confidence {h.confidence}
                        {h.claimIds?.length
                          ? ` · ${h.claimIds.length} source${h.claimIds.length > 1 ? "s" : ""} in The Hold`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className="m-0 text-[11px] leading-[1.5] text-[#a79e8b]">
                Guidance is drawn from community data in The Hold. Verify visa,
                immigration, customs, and medical specifics with official
                sources such as USCIS, the U.S. Department of State, or your
                university&apos;s international student office.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
