"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/check-in", label: "Check-In" },
  { href: "/manifest", label: "The Manifest" },
  { href: "/weigh-in", label: "Weigh-In" },
  { href: "/the-tower", label: "The Tower" },
];

const TICKER = [
  "TERMINAL 1 · INTL DEPARTURES",
  "DEL / BOM / MAA → USA",
  "CABIN 7KG · CHECKED 2×23KG",
];

export function Nav() {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-nav-border bg-nav">
        <div className="mx-auto flex h-[60px] max-w-[1120px] items-center justify-between gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-[7px] bg-accent text-[17px] font-bold text-accent-ink">
              ✓
            </span>
            <span className="font-display text-[17px] font-bold tracking-[0.02em] text-nav-text">
              Checked
            </span>
            <span className="border-l border-[#24354f] pl-2 font-mono text-[9px] tracking-[0.22em] text-nav-muted">
              DEPARTURES
            </span>
          </Link>
          <nav className="flex flex-wrap justify-end gap-0.5">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-nav-border text-nav-text"
                      : "text-[#7c90b0] hover:text-nav-text",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="border-b border-[#16233b] bg-nav-deep">
        <div className="mx-auto flex max-w-[1120px] gap-6 overflow-hidden whitespace-nowrap px-5 py-[7px] font-mono text-[10.5px] tracking-[0.15em] text-[#6e86ad]">
          <span className="inline-flex items-center gap-1.5 text-accent">
            <span
              className="h-[7px] w-[7px] rounded-full bg-accent"
              style={{ animation: "ck-blink 1.4s steps(1) infinite" }}
            />
            LIVE
          </span>
          {TICKER.map((t) => (
            <span key={t}>{t}</span>
          ))}
          <span className="text-[#8fa3c4]">EVERYTHING, CHECKED.</span>
        </div>
      </div>
    </>
  );
}
