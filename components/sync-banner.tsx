"use client";

import { useApp } from "@/lib/store";

/**
 * A quiet, dismissible banner shown when a background save to the server fails.
 * The user's work is still safe in localStorage — this just tells them it may
 * not have reached their account, so they can retry (an edit re-pushes it).
 */
export function SyncBanner() {
  const { syncError, dismissSyncError } = useApp();
  if (!syncError) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-[560px] items-start gap-3 rounded-[12px] border border-[#f2c9c2] bg-[#fbe8e5] px-4 py-3 shadow-[0_16px_40px_-24px_rgba(20,26,38,0.6)]"
    >
      <span className="mt-px text-[15px] leading-none text-[#b23127]">⚠</span>
      <p className="m-0 flex-1 text-[13px] leading-[1.5] text-[#7a2019]">
        Some changes may not have saved to your account. They&apos;re kept on
        this device — check your connection, and editing again will retry.
      </p>
      <button
        onClick={dismissSyncError}
        className="-mr-1 -mt-0.5 rounded-md px-2 py-1 font-mono text-[11px] tracking-[0.1em] text-[#7a2019] hover:bg-[#f6d9d4]"
        aria-label="Dismiss"
      >
        DISMISS
      </button>
    </div>
  );
}
