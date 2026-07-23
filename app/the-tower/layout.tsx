import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Tower — ask anything about moving to the US",
  description:
    "Ask The Tower anything about relocating from India to the US — customs, winter gear, kitchen kit, what to bring vs buy — grounded in The Hold, built from real student experiences.",
  alternates: { canonical: "/the-tower" },
  openGraph: {
    type: "website",
    url: "/the-tower",
    title: "The Tower — ask anything about moving to the US",
    description:
      "Community-grounded answers for Indian students relocating to the US: customs, winter gear, kitchen kit, bring-vs-buy, and more.",
  },
};

/**
 * Static, server-rendered reference content. The interactive tool above is a
 * client component (invisible to a crawler until JS runs), so this section
 * gives search engines real, indexable prose + an FAQ. Kept honest and general
 * — it mirrors the community guidance in The Hold, not personalized advice.
 */
const FAQ = [
  {
    q: "Should I bring a pressure cooker to the US?",
    a: "For most Indian students, yes. A pressure cooker is central to everyday cooking, and Indian-style cookers are pricier and harder to find in the US. Pack it well-wrapped in checked luggage.",
  },
  {
    q: "Can I carry rice, spices, and packaged food through US customs?",
    a: "Sealed, commercially packaged dry spices, lentils, and rice are generally allowed — but you must declare all food on your customs form. Avoid fresh produce, meat, and homemade food, which are restricted. When in doubt, declare it.",
  },
  {
    q: "Do I need a winter jacket from India, or should I buy one in the US?",
    a: "If you land somewhere cold, a light jacket for the journey helps. But a proper winter coat is usually better bought locally — US stores carry warmer, better-value options suited to the climate, and it saves scarce luggage weight.",
  },
  {
    q: "Which documents must I pack in my carry-on?",
    a: "Keep your passport with F-1 visa, I-20, admission letter, financial documents, and academic transcripts in your carry-on — never in checked luggage. Carry printed copies plus digital backups.",
  },
  {
    q: "How does Checked decide what to bring versus buy?",
    a: "Every verdict weighs the India-vs-US price difference, luggage weight, how easily you can buy it locally, and how essential it is for your first weeks — informed by what past students reported after they arrived.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function TowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}

      <section className="mx-auto mt-14 max-w-[680px] border-t border-divider pt-10">
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          BRIEFING
        </div>
        <h2 className="m-0 font-display text-[24px] font-bold tracking-[-0.01em]">
          Packing questions, answered before you fly
        </h2>
        <p className="mt-2.5 text-[15px] leading-[1.6] text-ink-muted">
          The Tower is where Indian students moving to the US ask the messy,
          real questions about a first move abroad — what clears customs, what
          to bring versus buy, which kitchen kit is worth the luggage weight,
          and how to pack for a cold campus. Answers are grounded in{" "}
          <span className="text-ink">The Hold</span>, a corpus built from what
          students actually reported after they landed. Below
          are some of the questions that come up most.
        </p>

        <div className="mt-8 flex flex-col gap-6">
          {FAQ.map((f) => (
            <div key={f.q}>
              <h3 className="m-0 font-display text-[16px] font-semibold text-ink">
                {f.q}
              </h3>
              <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-muted">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
