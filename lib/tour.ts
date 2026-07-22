"use client";

import { useEffect, useState } from "react";

/**
 * First-run flag for the guided feature tours. Kept deliberately out of the
 * synced app store (lib/store.tsx) — "have I seen the tutorial" is fine as a
 * device-local flag and doesn't warrant a Neon column or server round-trip.
 */

/** Bump to re-show every tour after a material redesign. */
export const TOUR_VERSION = 1;

/** Known tours; also the localStorage key segment and the per-page controller id. */
export type TourKey = "checkin" | "manifest" | "weighin";

function storageKey(key: TourKey): string {
  return `checked.tour.${key}.v${TOUR_VERSION}`;
}

/** Has the user already finished/skipped this tour on this device? */
export function tourSeen(key: TourKey): boolean {
  if (typeof window === "undefined") return true; // never auto-start during SSR
  try {
    return window.localStorage.getItem(storageKey(key)) === "1";
  } catch {
    return true; // private mode / storage disabled → don't nag
  }
}

/** Remember that the user has finished/skipped this tour. */
export function markTourSeen(key: TourKey): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(key), "1");
  } catch {
    /* ignore — nothing we can do if storage is unavailable */
  }
}

export interface TourController {
  /** Whether the overlay should currently render. */
  open: boolean;
  /** Manually (re)start the tour — ignores the seen flag (replay button). */
  start: () => void;
  /** Finish or skip — closes the overlay and marks the tour seen. */
  close: () => void;
}

interface UseTourOptions {
  /**
   * Gate the one-time auto-start. Pass false while the page can't host the tour
   * yet (store not hydrated, empty state, wrong mode); auto-start fires the first
   * render this flips true and the tour hasn't been seen.
   */
  canAutoStart: boolean;
}

/**
 * Drives a single page's tour. Auto-opens once (first time `canAutoStart` is
 * true and the tour is unseen); `start()` reopens it on demand.
 */
export function useTourController(
  key: TourKey,
  { canAutoStart }: UseTourOptions,
): TourController {
  const [open, setOpen] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);

  useEffect(() => {
    if (autoStarted || !canAutoStart) return;
    // Only ever consider auto-starting once per mount.
    setAutoStarted(true);
    if (!tourSeen(key)) setOpen(true);
  }, [key, canAutoStart, autoStarted]);

  return {
    open,
    start: () => setOpen(true),
    close: () => {
      setOpen(false);
      markTourSeen(key);
    },
  };
}
