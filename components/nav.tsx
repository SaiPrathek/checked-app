"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";

// The three linear packing steps collapse into one "Packing" nav entry that
// resumes wherever the user last was. Tower & Debrief stay standalone.
const JOURNEY = ["/check-in", "/manifest", "/weigh-in"];
const JOURNEY_KEY = "checked.journey.last.v1";

const TICKER = [
  "TERMINAL 1 · INTL DEPARTURES",
  "DEL / BOM / MAA → USA",
  "CABIN 7KG · CHECKED 2×23KG",
];

export function Nav() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  // Remember the last journey step visited so the combined "Packing" link resumes there.
  const [lastJourney, setLastJourney] = useState("/check-in");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(JOURNEY_KEY);
      if (saved && JOURNEY.includes(saved)) setLastJourney(saved);
    } catch {
      /* private mode / SSR — fall back to the default step */
    }
  }, []);
  useEffect(() => {
    if (JOURNEY.includes(pathname)) {
      setLastJourney(pathname);
      try {
        localStorage.setItem(JOURNEY_KEY, pathname);
      } catch {
        /* ignore — resume defaults to Check-In */
      }
    }
  }, [pathname]);

  const links = [
    { href: lastJourney, label: "Packing", match: JOURNEY },
    { href: "/the-tower", label: "The Tower", match: ["/the-tower"] },
    { href: "/debrief", label: "Debrief", match: ["/debrief"] },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-nav-border bg-nav">
        <div className="mx-auto flex h-[60px] max-w-[1120px] items-center justify-between gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Checked home">
            <LogoMark className="h-8 w-8 flex-shrink-0" />
            <span className="font-display text-[17px] font-bold tracking-[0.02em] text-nav-text">
              Checked
            </span>
            <span className="border-l border-[#24354f] pl-2 font-mono text-[9px] tracking-[0.22em] text-nav-muted">
              DEPARTURES
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden flex-wrap justify-end gap-0.5 sm:flex">
              {links.map((l) => {
                const active = l.match.includes(pathname);
                return (
                  <Link
                    key={l.label}
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
            <div className="ml-1 flex items-center">
              {!isLoaded ? (
                <span className="h-8 w-8" aria-hidden />
              ) : isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: { avatarBox: "h-8 w-8 ring-2 ring-nav-border" },
                  }}
                />
              ) : (
                <SignInButton mode="modal">
                  <button className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink hover:brightness-[0.96]">
                    Sign in
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
        <nav className="flex items-center justify-between gap-1 overflow-x-auto border-t border-nav-border px-3 py-1.5 sm:hidden">
          {links.map((l) => {
            const active = l.match.includes(pathname);
            return (
              <Link
                key={l.label}
                href={l.href}
                className={cn(
                  "flex-shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
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
