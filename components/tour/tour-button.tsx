"use client";

import { cn } from "@/lib/utils";

interface TourButtonProps {
  onClick: () => void;
  className?: string;
}

/** Small "? Tour" affordance for a page header — replays that page's guided tour. */
export function TourButton({ onClick, className }: TourButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-card-border bg-card px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] text-ink-muted transition-colors hover:text-ink hover:bg-divider",
        className,
      )}
      aria-label="Take the guided tour of this page"
    >
      <span aria-hidden className="grid h-[15px] w-[15px] place-items-center rounded-full border border-current text-[10px] font-bold leading-none">
        ?
      </span>
      TOUR
    </button>
  );
}
