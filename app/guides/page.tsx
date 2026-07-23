import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Packing guides for Indian students moving to the US",
  description:
    "Practical, weight-aware packing guides for Indian students moving to the US for a masters — what to bring from India, what to buy after landing, and a full checklist.",
  keywords: [
    "packing guides indian students usa",
    "packing for masters in usa",
    "india to us packing checklist",
  ],
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6">
      <header>
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          GUIDES
        </div>
        <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
          Packing guides for your move to the US
        </h1>
        <p className="mt-1.5 max-w-[560px] text-[15px] leading-[1.6] text-ink-muted">
          Straight, weight-aware advice for Indian students relocating to the US
          for a masters — what to bring from India, what to buy after landing,
          and how to fit it all inside your airline&apos;s limit. When
          you&apos;re ready,{" "}
          <Link href="/check-in" className="font-semibold text-primary underline underline-offset-2">
            build a list tailored to you
          </Link>
          .
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="rounded-[14px] border border-card-border bg-card p-5 shadow-[0_12px_26px_-24px_rgba(20,26,38,0.5)] transition-colors hover:border-primary"
          >
            <h2 className="m-0 font-display text-[18px] font-bold tracking-[-0.01em] text-ink">
              {g.title}
            </h2>
            <p className="mt-1.5 text-[14px] leading-[1.55] text-ink-muted">
              {g.description}
            </p>
            <span className="mt-2 inline-block font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              Read the guide →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
