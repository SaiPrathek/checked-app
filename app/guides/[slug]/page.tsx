import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, guideBySlug } from "@/lib/guides";

const BASE = "https://checked.co.in";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) return {};
  return {
    title: guide.metaTitle,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      url: `/guides/${guide.slug}`,
      title: guide.metaTitle,
      description: guide.description,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        author: { "@type": "Organization", name: "Checked" },
        publisher: { "@type": "Organization", name: "Checked" },
        mainEntityOfPage: `${BASE}/guides/${guide.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <article className="mx-auto flex max-w-[720px] flex-col gap-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/guides"
        className="flex w-fit items-center gap-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-primary"
      >
        <span aria-hidden>←</span> Guides
      </Link>

      <header>
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          GUIDE
        </div>
        <h1 className="m-0 font-display text-[32px] font-bold leading-[1.1] tracking-[-0.02em]">
          {guide.title}
        </h1>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-mono-muted">
          Updated {guide.updated}
        </p>
      </header>

      <div className="flex flex-col gap-3 text-[15px] leading-[1.65] text-ink-muted">
        {guide.intro.map((p, i) => (
          <p key={i} className="m-0">
            {p}
          </p>
        ))}
      </div>

      {/* Primary funnel into the app */}
      <div className="rounded-[14px] border border-card-border bg-[#f6f1e6] p-4">
        <p className="m-0 text-[14px] leading-[1.55] text-ink">
          Want this tailored to your school, city, and how you cook?{" "}
          <Link href="/check-in" className="font-semibold text-primary underline underline-offset-2">
            Build your personalized packing list →
          </Link>
        </p>
      </div>

      {guide.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-2">
          <h2 className="mb-0 mt-3 font-display text-[20px] font-bold tracking-[-0.01em] text-ink">
            {s.heading}
          </h2>
          {s.body.map((p, i) => (
            <p key={i} className="m-0 text-[15px] leading-[1.65] text-ink-muted">
              {p}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-4 border-t border-divider pt-6">
        <h2 className="m-0 font-display text-[22px] font-bold tracking-[-0.01em] text-ink">
          Frequently asked questions
        </h2>
        <div className="mt-4 flex flex-col gap-5">
          {guide.faq.map((f) => (
            <div key={f.q}>
              <h3 className="m-0 font-display text-[16px] font-semibold text-ink">
                {f.q}
              </h3>
              <p className="mt-1.5 text-[14.5px] leading-[1.6] text-ink-muted">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 flex flex-wrap gap-2.5 border-t border-divider pt-6">
        <Link
          href="/check-in"
          className="inline-flex h-11 items-center rounded-[9px] bg-accent px-5 text-[14.5px] font-semibold text-accent-ink"
        >
          Start your Check-In →
        </Link>
        <Link
          href="/the-tower"
          className="inline-flex h-11 items-center rounded-[9px] border border-card-border bg-card px-5 text-[14.5px] font-semibold text-ink"
        >
          Ask The Tower a question
        </Link>
      </div>
    </article>
  );
}
