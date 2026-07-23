/**
 * Content-SEO guides. These are the indexable, server-rendered pages that let
 * Checked rank for informational long-tail queries ("help packing for masters
 * in US", "what to bring from India for MS in USA"). Prose is drawn from the
 * same community guidance as The Hold — genuinely useful, not thin SEO filler —
 * and every guide funnels readers into the (noindex) app tools.
 */

export interface GuideSection {
  heading: string;
  body: string[]; // paragraphs
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  title: string; // page H1
  metaTitle: string; // <title>
  description: string; // meta description
  keywords: string[];
  updated: string;
  intro: string[]; // lead paragraphs
  sections: GuideSection[];
  faq: GuideFaq[];
}

export const GUIDES: Guide[] = [
  {
    slug: "packing-for-masters-in-usa",
    title: "Packing for your Masters in the USA: a complete guide for Indian students",
    metaTitle: "Packing for Masters in USA — Guide for Indian Students",
    description:
      "Help packing for your masters in the US? A practical, weight-aware guide for Indian students on what to bring from India, what to buy after landing, and what to skip.",
    keywords: [
      "packing for masters in usa",
      "what to bring from india for ms in usa",
      "help packing for masters in us",
      "indian student packing list usa",
      "study abroad packing list india",
    ],
    updated: "July 23, 2026",
    intro: [
      "Packing for a masters in the US is really a weight-budget problem: two checked bags and a cabin bag, roughly 23 kg each, to carry everything you need for the first few weeks of a new life abroad. The winning strategy isn't to bring more — it's to bring the few things that are genuinely cheaper, better, or harder to find in India, and buy the rest after you land.",
      "This guide walks through that decision for Indian students specifically — what's worth the luggage weight, what to buy in the US, and what to leave behind — so you arrive light but ready.",
    ],
    sections: [
      {
        heading: "Documents come first — and they go in your carry-on",
        body: [
          "Before clothes or kitchen kit, sort your paperwork. Your passport with F-1 visa, I-20, admission and financial documents, and academic transcripts belong in your cabin bag — never in checked luggage that could get delayed. Carry printed copies and keep digital backups in your email and cloud.",
          "This is the one category where there's no bring-vs-buy debate: you simply cannot replace these after landing.",
        ],
      },
      {
        heading: "Bring from India: the things that are genuinely worth it",
        body: [
          "A pressure cooker is the classic example — central to everyday Indian cooking, and pricier and harder to find in the US. Spices, dals, and ready masalas are lighter, cheaper, and better from home (sealed and commercially packaged, so they clear customs when declared). Prescription medicines with a doctor's note and prescription, a set of Indian formal/ethnic wear for events, and good-quality spectacles (a spare pair is cheap insurance) all earn their place.",
          "The test for each item: is it clearly cheaper or better from India, hard to buy locally, and needed in your first weeks? If yes, pack it.",
        ],
      },
      {
        heading: "Buy in the US: don't waste luggage weight on these",
        body: [
          "Bedding, towels, a proper winter coat, everyday electronics and appliances (which run on 120V and are often cheaper there anyway), toiletries in bulk, and stationery are almost always better bought after you land. A heavy winter coat especially: US stores carry warmer, better-value options suited to the actual climate, and it frees scarce kilos.",
          "A light jacket for the journey and first day is worth carrying if you're landing somewhere cold — but the real winter kit can wait until you're there.",
        ],
      },
      {
        heading: "What to skip entirely",
        body: [
          "Bulky items you can borrow, rent, or buy used near campus — and anything you're packing 'just in case'. Every kilo you don't spend on a maybe is a kilo for something you'll actually use. When you're unsure, leave it: shipping a forgotten item later is cheaper than paying excess-baggage fees at the airport.",
        ],
      },
      {
        heading: "Weigh as you pack",
        body: [
          "Airline limits are unforgiving and repacking at the check-in counter is stressful. Decide your bags, assign each item, and watch the weight before you leave for the airport — not at it.",
        ],
      },
    ],
    faq: [
      {
        q: "What should I definitely bring from India for my masters?",
        a: "Documents (in your carry-on), a pressure cooker, spices and dals, prescription medicines with a doctor's note, a set of ethnic/formal wear, and a spare pair of glasses. These are cheaper, better, or harder to replace in the US.",
      },
      {
        q: "What should I buy after landing in the US instead of packing?",
        a: "Bedding, towels, a proper winter coat, everyday electronics and appliances, bulk toiletries, and stationery. They're bulky or heavy, and usually cheaper and better-suited locally.",
      },
      {
        q: "How much luggage can I bring as an F-1 student?",
        a: "It depends on your airline and ticket, but a common allowance is two checked bags around 23 kg each plus a cabin bag. Always confirm your specific airline's limits before you pack.",
      },
      {
        q: "Can I bring Indian food and spices through US customs?",
        a: "Sealed, commercially packaged dry spices, lentils, and rice are generally fine — but you must declare all food on your customs form. Avoid fresh produce, meat, and homemade food.",
      },
    ],
  },
  {
    slug: "india-to-us-packing-checklist",
    title: "India to US packing checklist for students",
    metaTitle: "India to US Packing Checklist for Students",
    description:
      "A category-by-category India-to-US packing checklist for students — documents, clothing, kitchen, medicines, and electronics — built to fit your airline's weight limit.",
    keywords: [
      "india to us packing checklist",
      "packing list for us students",
      "student travel checklist india usa",
      "f1 visa packing list",
    ],
    updated: "July 23, 2026",
    intro: [
      "A good packing checklist isn't a giant list of everything — it's an ordered one that starts with what you can't replace and ends with what you shouldn't bother carrying. Here's how to think about each category on the way from India to the US.",
    ],
    sections: [
      {
        heading: "Documents (carry-on only)",
        body: [
          "Passport with F-1 visa, I-20, admission letter, financial and scholarship documents, academic transcripts and mark sheets, passport photos, and printed copies of everything. Keep this in your cabin bag with digital backups.",
        ],
      },
      {
        heading: "Medicines & health",
        body: [
          "A basic supply of any prescription medicines, with the prescription and a doctor's note, plus a small first-aid kit and any specific over-the-counter medicines you rely on. Spectacles and a spare pair if you wear them.",
        ],
      },
      {
        heading: "Clothing",
        body: [
          "A week's worth of everyday clothes, a light jacket for the journey, and a set of ethnic/formal wear. Leave the heavy winter coat and bulk basics — buy those locally, sized to the climate.",
        ],
      },
      {
        heading: "Kitchen",
        body: [
          "A pressure cooker if you cook Indian food, plus spices, dals, and ready masalas. Skip bulky utensils and crockery — cheap and easy to buy near campus.",
        ],
      },
      {
        heading: "Electronics",
        body: [
          "Phone, laptop, chargers, a universal adapter, and a power bank (in your carry-on — lithium batteries can't be checked). Most other appliances are cheaper on 120V in the US.",
        ],
      },
    ],
    faq: [
      {
        q: "What's the single most important thing on the checklist?",
        a: "Your documents, in your carry-on. A delayed checked bag is an inconvenience; a lost passport or I-20 is a crisis.",
      },
      {
        q: "Should lithium batteries and power banks go in checked or cabin luggage?",
        a: "Cabin only. Airlines prohibit lithium batteries and power banks in checked luggage for safety reasons.",
      },
    ],
  },
  {
    slug: "what-to-buy-after-landing-in-the-us",
    title: "What to buy after landing in the US (and what to bring instead)",
    metaTitle: "What to Buy After Landing in the US — Student Guide",
    description:
      "A guide for Indian students on what to buy after landing in the US versus what to pack from India — bedding, winter coat, electronics, toiletries, and more.",
    keywords: [
      "what to buy after landing in the us",
      "what to buy in usa as a student",
      "buy vs bring usa indian students",
      "first week shopping list usa student",
    ],
    updated: "July 23, 2026",
    intro: [
      "The fastest way to lighten your bags is to trust that the US has shops. Plenty of things are cheaper, better, or simply easier to buy after you land — and buying locally means the right size, voltage, and climate fit. Here's what to leave off your packing list and pick up in your first week.",
    ],
    sections: [
      {
        heading: "Bedding and towels",
        body: [
          "Sheets, a comforter, pillows, and towels are bulky and cheap to buy locally (check the bed size your housing uses — many US dorms are Twin XL). Not worth a single kilo of your allowance.",
        ],
      },
      {
        heading: "A proper winter coat",
        body: [
          "If your campus gets cold, buy the real coat there. US stores carry warmer, better-value options built for that climate. Carry only a light jacket for the journey.",
        ],
      },
      {
        heading: "Electronics and appliances",
        body: [
          "The US runs on 120V. Everyday appliances are designed for it and are often cheaper there — buy them locally rather than carrying converters and risking damage.",
        ],
      },
      {
        heading: "Toiletries and stationery",
        body: [
          "Bring a small starter supply for the first couple of days, then buy in bulk locally. Textbooks and stationery are easy to get near campus (and textbooks are often cheaper rented or used).",
        ],
      },
    ],
    faq: [
      {
        q: "Is it cheaper to buy electronics in the US or bring them from India?",
        a: "For most everyday electronics and appliances, buy in the US — they're built for 120V and are frequently cheaper. Bring only your phone, laptop, and chargers.",
      },
      {
        q: "Should I buy a winter coat in India or the US?",
        a: "Buy the proper winter coat in the US, sized to your campus climate. Carry only a light jacket for the journey and your first day.",
      },
    ],
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
