import Link from "next/link";
import { HOLD } from "@/lib/hold";

const FLIGHTS = [
  { href: "/check-in", flight: "CK 01", name: "Check-In", dest: "Profile & preferences", gate: "A1", status: "BOARDING", fg: "#FFD98A", bg: "rgba(245,166,35,0.16)" },
  { href: "/manifest", flight: "CK 02", name: "The Manifest", dest: "Your packing list", gate: "B4", status: "ON TIME", fg: "#7BE0A8", bg: "rgba(20,122,72,0.2)" },
  { href: "/weigh-in", flight: "CK 03", name: "Weigh-In", dest: "Bag weight simulator", gate: "C2", status: "ON TIME", fg: "#7BE0A8", bg: "rgba(20,122,72,0.2)" },
  { href: "/the-tower", flight: "CK 04", name: "The Tower", dest: "Ask anything · ATC", gate: "D7", status: "STANDBY", fg: "#A9BAD4", bg: "rgba(94,119,160,0.2)" },
  { href: "/debrief", flight: "CK 05", name: "Debrief", dest: "Feedback · post-flight", gate: "E5", status: "ARRIVED", fg: "#FFD98A", bg: "rgba(245,166,35,0.16)" },
];

const FEATURES = [
  { href: "/check-in", name: "Check-In", flight: "CK 01", gate: "A1", blurb: "A quick, conversational profile — school, city, intake and housing — so every verdict is personalized to you." },
  { href: "/manifest", name: "The Manifest", flight: "CK 02", gate: "B4", blurb: "Your packing list with a clear verdict on each item: bring, buy, either, or skip — with the reasoning." },
  { href: "/weigh-in", name: "Weigh-In", flight: "CK 03", gate: "C2", blurb: "Assign items to your bags and watch live weight meters. Never be 4 kg over at the airport counter again." },
  { href: "/the-tower", name: "The Tower", flight: "CK 04", gate: "D7", blurb: "Ask anything — customs, winter gear, kitchen kit — grounded in The Hold's community data." },
  { href: "/debrief", name: "Debrief", flight: "CK 05", gate: "E5", blurb: "Landed already? Tell us what was worth packing. Every rating strengthens the community-backed verdicts in The Hold." },
];

const BARS = [2, 1, 3, 1, 2, 1, 3, 2, 1];

export default function Home() {
  const contested = HOLD.filter((h) => h.contested).length;
  return (
    <div className="flex flex-col gap-8">
      {/* hero */}
      <section className="relative overflow-hidden rounded-[20px] border border-nav-border bg-nav px-[30px] pb-[34px] pt-[30px] shadow-[0_30px_60px_-30px_rgba(6,12,24,0.7)]">
        <div className="mb-[22px] flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-nav-muted">
          <span className="text-accent">▸ DEPARTURES</span>
          <span className="hidden sm:inline">13 JUL 2026 · 09:41 IST</span>
          <span className="text-[9px] sm:hidden">13 JUL · 09:41</span>
        </div>
        <h1 className="m-0 font-display text-[clamp(38px,7vw,74px)] font-bold leading-[0.98] tracking-[-0.02em] text-nav-text">
          Everything,
          <br />
          <span className="text-accent">checked.</span>
        </h1>
        <p className="mt-[18px] max-w-[560px] text-[16px] leading-[1.55] text-[#a9bad4]">
          The chaos of a first move abroad, turned into a personalized,
          weight-aware, community-backed checklist — item by item, bring-vs-buy,
          with the reasoning behind every call.
        </p>

        {/* flight board */}
        <div className="mt-[26px] overflow-hidden rounded-xl border border-[#22344f]">
          <div className="grid grid-cols-[62px_1fr_38px] gap-2 bg-nav-deep px-4 py-[9px] font-mono text-[9px] tracking-[0.12em] text-nav-muted sm:grid-cols-[78px_1fr_52px_108px] sm:text-[10px] sm:tracking-[0.18em]">
            <span>FLIGHT</span>
            <span>DESTINATION</span>
            <span>GATE</span>
            <span className="hidden text-right sm:block">STATUS</span>
          </div>
          {FLIGHTS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="grid grid-cols-[62px_1fr_38px] items-center gap-2 border-t border-[#1a2942] px-4 py-[13px] font-mono sm:grid-cols-[78px_1fr_52px_108px]"
            >
              <span className="text-[14px] font-medium tracking-[0.05em] text-accent">
                {f.flight}
              </span>
              <span className="font-display text-[15px] font-semibold tracking-[0.02em] text-nav-text">
                {f.name}
                <span className="mt-px block font-sans text-[12px] font-normal tracking-normal text-[#7c90b0]">
                  {f.dest}
                </span>
              </span>
              <span className="text-[13px] text-[#c7d4e8]">{f.gate}</span>
              <span
                className="hidden justify-self-end rounded-[5px] px-[9px] py-1 text-[10px] tracking-[0.14em] sm:block"
                style={{ color: f.fg, background: f.bg }}
              >
                {f.status}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-[26px] flex flex-wrap items-center gap-3">
          <Link
            href="/check-in"
            className="flex h-12 items-center rounded-[9px] bg-accent px-6 text-[15px] font-semibold text-accent-ink"
          >
            Start with Check-In →
          </Link>
          <Link
            href="/manifest"
            className="flex h-12 items-center rounded-[9px] border border-[#2c4064] px-[22px] text-[15px] font-semibold text-[#e7edf7]"
          >
            Skip to The Manifest
          </Link>
          <span className="ml-0.5 font-mono text-[11px] tracking-[0.08em] text-nav-muted">
            {HOLD.length} VERDICTS · {contested} CONTESTED
          </span>
        </div>
      </section>

      {/* boarding-pass feature cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]">
        {FEATURES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="relative flex overflow-hidden rounded-[14px] border border-card-border bg-card shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_34px_-26px_rgba(20,26,38,0.5)]"
          >
            <div className="flex flex-1 flex-col gap-2.5 px-5 pb-4 pt-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-[19px] font-bold tracking-[-0.01em]">
                  {c.name}
                </span>
                <span className="text-[18px] text-[#b7af9c]">→</span>
              </div>
              <p className="m-0 flex-1 text-[13.5px] leading-[1.5] text-ink-muted">
                {c.blurb}
              </p>
              <div className="mt-0.5 flex h-[26px] items-center gap-1.5">
                <span className="flex h-[22px] items-end gap-0.5">
                  {BARS.map((w, i) => (
                    <span
                      key={i}
                      className="h-[22px] bg-ink"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-mono-muted">
                  {c.flight} · GATE {c.gate}
                </span>
              </div>
            </div>
            {/* perforation + stub */}
            <div className="w-0 border-l-2 border-dashed border-[#e0d6c2]" />
            <span className="absolute right-[52px] top-[-8px] h-4 w-4 rounded-full border border-card-border bg-paper" />
            <span className="absolute bottom-[-8px] right-[52px] h-4 w-4 rounded-full border border-card-border bg-paper" />
            <div className="flex w-[52px] items-center justify-center bg-nav">
              <span className="font-mono text-[9px] tracking-[0.32em] text-accent [writing-mode:vertical-rl] [transform:rotate(180deg)]">
                BOARDING PASS
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
