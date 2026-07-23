import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The linear packing journey: Check-In → Manifest → Weigh-In. Shown at the top
 * of those three pages as a combined step bar with Back/Next. The Tower and
 * Debrief are intentionally NOT part of this flow (they get their own nav).
 */
const STEPS = [
  { key: "check-in", href: "/check-in", label: "Check-In" },
  { key: "manifest", href: "/manifest", label: "The Manifest" },
  { key: "weigh-in", href: "/weigh-in", label: "Weigh-In" },
] as const;

export type JourneyStep = (typeof STEPS)[number]["key"];

export function JourneyNav({
  current,
  showNext = true,
}: {
  current: JourneyStep;
  /** Hide the forward button until a step is ready to advance (Check-In gates on a completed profile). */
  showNext?: boolean;
}) {
  const idx = STEPS.findIndex((s) => s.key === current);
  const prev = STEPS[idx - 1];
  const next = STEPS[idx + 1];

  return (
    <nav
      aria-label="Packing journey"
      className="flex items-center justify-between gap-2 rounded-[12px] border border-card-border bg-card px-2 py-2 sm:px-3"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="flex items-center gap-1 rounded-[8px] px-2 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-primary"
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">{prev.label}</span>
          <span className="sm:hidden">Back</span>
        </Link>
      ) : (
        <span className="w-8 flex-shrink-0" aria-hidden />
      )}

      <ol className="flex items-center gap-1.5 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const isCurrent = i === idx;
          return (
            <li key={s.key} className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href={s.href}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  isCurrent ? "text-ink" : "text-mono-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 flex-shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold",
                    isCurrent
                      ? "bg-accent text-accent-ink"
                      : done
                        ? "bg-nav text-nav-text"
                        : "border border-field-border text-mono-muted",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden font-mono text-[10.5px] uppercase tracking-[0.1em] sm:inline",
                    isCurrent ? "font-semibold" : "font-medium",
                  )}
                >
                  {s.label}
                </span>
              </Link>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="text-[10px] text-[#c9bfa9]">
                  ·
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {next && showNext ? (
        <Link
          href={next.href}
          className="flex items-center gap-1 rounded-[8px] bg-primary px-2.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-hover"
        >
          <span className="hidden sm:inline">{next.label}</span>
          <span className="sm:hidden">Next</span>
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <span className="w-8 flex-shrink-0" aria-hidden />
      )}
    </nav>
  );
}
