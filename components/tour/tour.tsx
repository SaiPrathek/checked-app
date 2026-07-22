"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TourStep {
  /** Matches [data-tour="…"] in the page. If not in the DOM, the step is skipped. */
  anchor: string;
  title: string;
  body: string;
  /** Preferred side for the tooltip; falls back automatically when there's no room. */
  placement?: Placement;
}

type Placement = "top" | "bottom" | "left" | "right";

interface TourProps {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

/** Gap between the highlighted target and the tooltip / spotlight ring. */
const PAD = 8;
const GAP = 12;
const TOOLTIP_W = 320;

function anchorEl(step: TourStep | undefined): HTMLElement | null {
  if (!step || typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`);
}

/** First index at/after `start` (walking in `dir`) whose anchor exists in the DOM. */
function findValid(steps: TourStep[], start: number, dir: 1 | -1): number {
  for (let i = start; i >= 0 && i < steps.length; i += dir) {
    if (anchorEl(steps[i])) return i;
  }
  return -1;
}

export function Tour({ steps, open, onClose }: TourProps) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: Placement }>({
    top: -9999,
    left: -9999,
    placement: "bottom",
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);

  useEffect(() => setMounted(true), []);

  // On open: remember focus, jump to the first present step (close if none exist).
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;
    const first = findValid(steps, 0, 1);
    if (first === -1) {
      onClose();
      return;
    }
    setIndex(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const finish = useCallback(() => {
    onClose();
    if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
  }, [onClose]);

  const goNext = useCallback(() => {
    const n = findValid(steps, index + 1, 1);
    if (n === -1) finish();
    else setIndex(n);
  }, [steps, index, finish]);

  const goBack = useCallback(() => {
    const p = findValid(steps, index - 1, -1);
    if (p !== -1) setIndex(p);
  }, [steps, index]);

  // Measure the target and position the tooltip. Re-runs on step change, scroll,
  // and resize so the spotlight stays glued to the element.
  useLayoutEffect(() => {
    if (!open) return;
    const step = steps[index];

    function measure() {
      const el = anchorEl(step);
      if (!el) {
        // Target vanished (conditional UI) — advance past it.
        goNext();
        return;
      }
      const r = el.getBoundingClientRect();
      setRect(r);

      const tip = tooltipRef.current;
      const tw = tip?.offsetWidth ?? TOOLTIP_W;
      const th = tip?.offsetHeight ?? 160;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Choose a side with enough room; prefer the requested placement.
      const room: Record<Placement, number> = {
        bottom: vh - r.bottom,
        top: r.top,
        right: vw - r.right,
        left: r.left,
      };
      const order: Placement[] = [
        step.placement ?? "bottom",
        "bottom",
        "top",
        "right",
        "left",
      ];
      const need = { vertical: th + GAP + PAD, horizontal: tw + GAP + PAD };
      const placement =
        order.find((p) =>
          p === "top" || p === "bottom"
            ? room[p] >= need.vertical
            : room[p] >= need.horizontal,
        ) ?? "bottom";

      let top: number;
      let left: number;
      if (placement === "bottom") {
        top = r.bottom + GAP;
        left = r.left + r.width / 2 - tw / 2;
      } else if (placement === "top") {
        top = r.top - th - GAP;
        left = r.left + r.width / 2 - tw / 2;
      } else if (placement === "right") {
        top = r.top + r.height / 2 - th / 2;
        left = r.right + GAP;
      } else {
        top = r.top + r.height / 2 - th / 2;
        left = r.left - tw - GAP;
      }
      // Clamp into the viewport (mobile-safe).
      left = Math.max(GAP, Math.min(left, vw - tw - GAP));
      top = Math.max(GAP, Math.min(top, vh - th - GAP));
      setCoords({ top, left, placement });
    }

    const el = anchorEl(step);
    if (!el) {
      goNext();
      return;
    }
    // Instant (not smooth) scroll: a smooth animation gets interrupted by the
    // re-render/re-measure cycle and under-scrolls, and the immediate measure()
    // below would read a pre-scroll rect. Instant scroll settles synchronously,
    // so the very first measure is already correct; the spotlight's own CSS
    // transition still animates the highlight between steps.
    el.scrollIntoView({ block: "center" });
    // Measure now (rect is already correct), and again after paint so the
    // tooltip can re-place itself once its real size is known.
    measure();
    const raf = requestAnimationFrame(measure);
    const t = window.setTimeout(measure, 60);

    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("scroll", measure, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, steps]);

  // Keyboard: Esc closes, arrows / Enter navigate.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish, goNext, goBack]);

  if (!mounted || !open || !rect) return null;

  const step = steps[index];
  if (!step) return null;

  // Human-facing counter over the present-in-DOM steps only.
  const presentIndexes = steps
    .map((s, i) => (anchorEl(s) ? i : -1))
    .filter((i) => i !== -1);
  const humanTotal = presentIndexes.length;
  const humanCurrent = presentIndexes.indexOf(index) + 1;
  const isLast = findValid(steps, index + 1, 1) === -1;
  const isFirst = findValid(steps, index - 1, -1) === -1;

  return createPortal(
    <div className="fixed inset-0 z-[100]" aria-live="polite" role="dialog" aria-modal="true">
      {/* Transparent click-catcher — the dimming comes from the spotlight's shadow. */}
      <div className="absolute inset-0" onClick={finish} />

      {/* Spotlight ring around the target; the huge box-shadow dims everything else. */}
      <div
        className="pointer-events-none absolute rounded-lg ring-2 ring-accent transition-all duration-200"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          boxShadow: "0 0 0 9999px rgba(13,22,38,0.66)",
        }}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute w-[320px] max-w-[calc(100vw-24px)] rounded-lg border border-card-border bg-card p-4 shadow-xl"
        style={{ top: coords.top, left: coords.left, animation: "ck-drop 0.28s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.18em] text-mono-muted">
          {String(humanCurrent).padStart(2, "0")} / {String(humanTotal).padStart(2, "0")}
        </div>
        <h3 className="font-display text-[16px] font-bold text-ink">{step.title}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish} className="px-2 text-[12.5px]">
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className={cn(isFirst && "invisible")}
            >
              Back
            </Button>
            <Button variant={isLast ? "accent" : "primary"} size="sm" onClick={goNext}>
              {isLast ? "Done" : "Next →"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
