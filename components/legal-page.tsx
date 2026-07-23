import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared frame for the static legal pages (Privacy, Terms, Disclosure).
 * Prose styling via arbitrary variants so each page stays plain JSX content.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto flex max-w-[720px] flex-col gap-5">
      <Link
        href="/"
        className="flex w-fit items-center gap-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-primary"
      >
        <span aria-hidden>←</span> Home
      </Link>
      <header>
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          LEGAL
        </div>
        <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-mono-muted">
          Last updated {updated}
        </p>
      </header>
      <div
        className="flex flex-col gap-4 text-[14.5px] leading-[1.65] text-ink-muted [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:font-display [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-ink"
      >
        {children}
      </div>
    </article>
  );
}
