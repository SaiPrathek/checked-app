"use client";

import { track } from "@/lib/actions/events";

/**
 * Client-side fire-and-forget analytics. Wraps the `track` server action so
 * callers (e.g. an affiliate CTA onClick) never have to await or handle errors
 * — a failed event must never interrupt the user's action.
 */
export function trackEvent(name: string, meta?: Record<string, unknown>): void {
  void track(name, meta).catch(() => {});
}
