"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useApp } from "@/lib/store";
import { PACKING_ITEMS } from "@/lib/packing-items";
import { getHoldItem } from "@/lib/hold";
import type { Category, PackingItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  submitDebrief,
  getMyDebriefs,
  deleteDebrief,
} from "@/lib/actions/debrief";
import {
  DEBRIEF_VERDICTS,
  DEBRIEF_LABEL,
  type DebriefVerdict,
} from "@/lib/debrief";

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

const VERDICT_STYLE: Record<DebriefVerdict, string> = {
  "worth-it": "bg-[#E7F4EC] text-[#147A48] border-[#B7E0C6]",
  useless: "bg-[#FBE8E5] text-[#B23127] border-[#F2C9C2]",
  "should-buy-there": "bg-[#E7F0FB] text-[#1257B8] border-[#BDD6F5]",
  "wish-brought-more": "bg-[#FBF1DC] text-[#9A5B00] border-[#F0DBAE]",
};

export default function Debrief() {
  const { isLoaded, isSignedIn } = useUser();
  const { list, hydrated } = useApp();

  const [myDebriefs, setMyDebriefs] = useState<Record<string, DebriefVerdict>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isSignedIn) return;
    getMyDebriefs()
      .then(setMyDebriefs)
      .catch((e) => console.error("getMyDebriefs", e));
  }, [isSignedIn]);

  const listedItems = useMemo(() => {
    const byId = new Map(PACKING_ITEMS.map((i) => [i.id, i]));
    // Only Hold-backed items can be debriefed — checklist-only items have no corpus entry to vote on.
    return list
      .map((id) => byId.get(id))
      .filter((x): x is PackingItem & { holdKey: string } => !!x && !!x.holdKey);
  }, [list]);

  const byCategory = useMemo(() => {
    const map = new Map<Category, (PackingItem & { holdKey: string })[]>();
    for (const it of listedItems) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return map;
  }, [listedItems]);

  const uniqueHoldKeys = useMemo(() => {
    const set = new Set<string>();
    for (const it of listedItems) set.add(it.holdKey);
    return Array.from(set);
    // (listedItems are guaranteed to have holdKey)
  }, [listedItems]);

  async function vote(holdKey: string, verdict: DebriefVerdict) {
    setPending(holdKey);
    const note = notes[holdKey]?.trim() || undefined;
    // optimistic
    setMyDebriefs((cur) => ({ ...cur, [holdKey]: verdict }));
    try {
      await submitDebrief(holdKey, verdict, note);
    } catch (e) {
      console.error("submitDebrief", e);
      setMyDebriefs((cur) => {
        const next = { ...cur };
        delete next[holdKey];
        return next;
      });
    } finally {
      setPending(null);
    }
  }

  async function undo(holdKey: string) {
    setPending(holdKey);
    setMyDebriefs((cur) => {
      const next = { ...cur };
      delete next[holdKey];
      return next;
    });
    try {
      await deleteDebrief(holdKey);
    } catch (e) {
      console.error("deleteDebrief", e);
    } finally {
      setPending(null);
    }
  }

  if (!hydrated || !isLoaded) {
    return <p className="font-mono text-xs text-mono-muted">LOADING…</p>;
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6">
      <div>
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          GATE E5 · CK 05 · POST-FLIGHT
        </div>
        <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
          Debrief
        </h1>
        <p className="mt-1.5 max-w-[540px] text-[15px] text-ink-muted">
          You&apos;ve landed. Tell us what was worth packing — every rating
          feeds The Hold and helps the next cohort pack smarter.
        </p>
      </div>

      {!isSignedIn ? (
        <div className="rounded-2xl border border-card-border bg-card p-6 text-center shadow-[0_18px_34px_-28px_rgba(20,26,38,0.5)]">
          <p className="mb-4 text-[15px] text-ink-muted">
            Debrief is signed-in only — your feedback is scoped to your profile
            (school, climate, intake) so stats can be filtered by cohort.
          </p>
          <SignInButton mode="modal">
            <button className="h-11 rounded-[9px] bg-accent px-6 text-[15px] font-semibold text-accent-ink">
              Sign in to Debrief
            </button>
          </SignInButton>
        </div>
      ) : listedItems.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card p-6 text-center shadow-[0_18px_34px_-28px_rgba(20,26,38,0.5)]">
          <p className="mb-4 text-[15px] text-ink-muted">
            Nothing to Debrief yet — your Manifest is empty. Add items in The
            Manifest, then come back after you&apos;ve been in the US for a bit.
          </p>
          <Link
            href="/manifest"
            className="inline-flex h-11 items-center rounded-[9px] bg-accent px-5 text-[14.5px] font-semibold text-accent-ink"
          >
            Go to The Manifest →
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-card-border bg-[#f6f1e6] p-4 font-mono text-[11px] tracking-[0.14em] text-[#6c6555]">
            <span className="text-accent">▸</span> {uniqueHoldKeys.length} ITEM
            CATEGORIES · {Object.keys(myDebriefs).length} DEBRIEFED
          </div>

          {CATEGORY_ORDER.map((cat) => {
            const items = byCategory.get(cat);
            if (!items?.length) return null;
            // one row per unique hold key within the category
            const seen = new Set<string>();
            const rows = items.filter((it) => {
              if (seen.has(it.holdKey)) return false;
              seen.add(it.holdKey);
              return true;
            });
            return (
              <section key={cat} className="flex flex-col gap-2">
                <h2 className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-mono-muted">
                  {CATEGORY_LABEL[cat]}
                </h2>
                <div className="flex flex-col gap-3">
                  {rows.map((it) => {
                    const hold = getHoldItem(it.holdKey);
                    if (!hold) return null;
                    const current = myDebriefs[it.holdKey];
                    return (
                      <div
                        key={it.holdKey}
                        className="rounded-[14px] border border-card-border bg-card p-4 shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)]"
                      >
                        <div className="mb-3 flex items-baseline justify-between gap-3">
                          <span className="font-display text-[16px] font-bold capitalize">
                            {it.holdKey}
                          </span>
                          {current && (
                            <button
                              onClick={() => undo(it.holdKey)}
                              disabled={pending === it.holdKey}
                              className="font-mono text-[10.5px] tracking-[0.1em] text-mono-muted underline underline-offset-2 disabled:opacity-40"
                            >
                              CLEAR
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {DEBRIEF_VERDICTS.map((v) => {
                            const active = current === v;
                            return (
                              <button
                                key={v}
                                onClick={() => vote(it.holdKey, v)}
                                disabled={pending === it.holdKey}
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-all",
                                  active
                                    ? VERDICT_STYLE[v] + " ring-2 ring-offset-1"
                                    : "border-field-border bg-field text-ink-muted hover:bg-divider",
                                  pending === it.holdKey && "opacity-60",
                                )}
                              >
                                {DEBRIEF_LABEL[v]}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          placeholder="Optional note (e.g. worth it if you cook every day)"
                          value={notes[it.holdKey] ?? ""}
                          onChange={(e) =>
                            setNotes((c) => ({ ...c, [it.holdKey]: e.target.value }))
                          }
                          onBlur={() => {
                            const cur = myDebriefs[it.holdKey];
                            if (cur) vote(it.holdKey, cur);
                          }}
                          className="mt-3 h-9 w-full rounded-[8px] border border-field-border bg-field px-3 text-[13px] outline-none focus-visible:border-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-mono-muted">
            Every Debrief becomes a data point in The Hold · community stats
            surface at {3}+ responses
          </p>
        </>
      )}
    </div>
  );
}
