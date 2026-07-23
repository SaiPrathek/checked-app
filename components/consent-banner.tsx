"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "checked.consent.v1";

/**
 * A minimal, dismissible notice that we use local storage + privacy-friendly
 * analytics. Shown once until acknowledged (remembered in localStorage). Kept
 * device-local and out of the synced store, mirroring the tour seen-flag.
 */
export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setShow(true);
    } catch {
      /* private mode — just don't show it */
    }
  }, []);

  function acknowledge() {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy notice"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-[560px] flex-col gap-3 rounded-[12px] border border-card-border bg-card px-4 py-3.5 shadow-[0_16px_40px_-24px_rgba(20,26,38,0.6)] sm:flex-row sm:items-center"
    >
      <p className="m-0 flex-1 text-[13px] leading-[1.5] text-ink-muted">
        We store your packing data on this device (and in your account if you
        sign in) and use privacy-friendly analytics to improve Checked. See our{" "}
        <Link href="/privacy" className="text-primary underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        onClick={acknowledge}
        className="h-9 flex-shrink-0 rounded-[8px] bg-accent px-5 text-[13px] font-semibold text-accent-ink hover:brightness-[0.96]"
      >
        Got it
      </button>
    </div>
  );
}
