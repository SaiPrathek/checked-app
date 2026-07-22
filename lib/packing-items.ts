import type { PackingItem } from "./types";

/**
 * Concrete, packable line-items for The Manifest + Weigh-In.
 *
 * Grounded in the well-known "Sanjeev Sriram" India→US student packing list —
 * a curated superset with real per-item counts, buying-place verdicts and notes.
 *
 * Fields:
 *   holdKey    = links to a canonical verdict in The Hold (community stats + sources).
 *                Optional — checklist items with no Hold entry carry `verdict` + `detail` inline.
 *   verdict    = inline verdict when there's no Hold entry (bring-from-india / buy-in-us / either / skip).
 *   detail     = inline "Why?" explanation when there's no Hold entry.
 *   icon       = key into components/item-icon.tsx (falls back to a category glyph).
 *   baseQty    = default recommended count; deltaBy adjusts it per profile dimension.
 *   deltaBy    = additive per-dimension count deltas (clamped by minQty/maxQty).
 *   verdictBy  = profile-driven verdict shifts (first matching dimension wins).
 *   visibleIf  = hide items irrelevant to a profile (e.g. work docs only if workExperience === "yes").
 *   transport  = TSA rule: cabin "must" (docs, lithium, cash), "never" (blades, cookers, liquids/powders), "prefer".
 *   cabinSeed  = units Auto-Pack seeds into the cabin for resilience.
 *
 * Buying place → verdict: IN → bring-from-india, US → buy-in-us, NA docs → bring originals.
 */
export const PACKING_ITEMS: PackingItem[] = [
  // ── DOCUMENTS ──────────────────────────────────────────────────────────────
  {
    id: "passport", name: "Passport + visa & I-20 folder", holdKey: "documents",
    category: "documents", icon: "passport", weightKg: 0.4, suggested: true, baseQty: 1, volumeL: 0.5,
    transport: { cabin: "must", note: "originals stay on your person, never in checked bags" },
  },
  {
    id: "doc-copies", name: "Document photocopies (3 sets)",
    category: "documents", icon: "folder", weightKg: 0.5, suggested: true, baseQty: 3, volumeL: 0.6,
    verdict: "bring-from-india",
    detail: "Keep 3 photocopy sets of every key document (passport, visa, I-20, SEVIS, offer letters) split across bags — visa officers and university intake desks ask for them constantly.",
  },
  {
    id: "academic-docs", name: "Academic transcripts, memos & degree", holdKey: "documents",
    category: "documents", icon: "certificate", weightKg: 0.8, suggested: true, baseQty: 1, volumeL: 1.0,
    transport: { cabin: "must", note: "originals are irreplaceable — carry them on you" },
  },
  {
    id: "financial-docs", name: "Financial docs (loan, bank balance, CA reports)",
    category: "documents", icon: "folder", weightKg: 0.3, baseQty: 1, volumeL: 0.4,
    verdict: "bring-from-india",
    detail: "Loan sanction, bank balance certificate and CA/CE reports back up your I-20 funding — carry originals plus copies for the port of entry.",
  },
  {
    id: "work-docs", name: "Work experience proof (pay slips, offer & experience letters)",
    category: "documents", icon: "certificate", weightKg: 0.2, baseQty: 1, volumeL: 0.3,
    visibleIf: (p) => p.workExperience === "yes",
    verdict: "bring-from-india",
    detail: "Offer letter, a few pay slips and your experience certificate help with CPT/OPT and some assistantship paperwork later — bring originals + copies.",
  },
  {
    id: "id-cards", name: "Indian IDs (Aadhaar, PAN, birth certificate)",
    category: "documents", icon: "folder", weightKg: 0.1, baseQty: 1, volumeL: 0.2,
    transport: { cabin: "must", note: "keep with your passport, not in checked bags" },
    verdict: "bring-from-india",
    detail: "You'll still need Aadhaar and PAN for India-side banking and taxes; a birth certificate helps with some US identity forms.",
  },
  {
    id: "photos", name: "Passport-size photos", holdKey: "documents",
    category: "documents", icon: "photo", weightKg: 0.02, suggested: true, baseQty: 16, volumeL: 0.05,
    verdict: "bring-from-india",
    detail: "Carry ~16 recent passport photos — campus IDs, SSN applications and various forms need them, and US photo studios are pricey.",
  },
  {
    id: "license-docs", name: "Driving license + International Driving Permit",
    category: "documents", icon: "certificate", weightKg: 0.1, baseQty: 1, volumeL: 0.2,
    visibleIf: (p) => p.license === "yes",
    verdict: "bring-from-india",
    detail: "An IDP (get it before you fly) plus your Indian license lets you drive and rent cars for your first months before a US license.",
  },

  // ── MEDICINES ────────────────────────────────────────────────────────────────
  {
    id: "rx", name: "Prescription meds (1–2 months) + doctor's letter", holdKey: "prescription medicines",
    category: "medicines", icon: "pill", weightKg: 0.5, suggested: true, baseQty: 1, volumeL: 0.8,
    transport: { cabin: "must", note: "TSA wants medicines in the carry-on, with the doctor's letter" },
  },
  {
    id: "med-kit", name: "Everyday medicine kit", holdKey: "otc medicines",
    category: "medicines", icon: "pill", weightKg: 0.5, suggested: true, baseQty: 1, volumeL: 1.0,
    transport: { cabin: "prefer", note: "keep a few strips in your carry-on for the flight" },
  },
  {
    id: "balms-firstaid", name: "Balms & first-aid (Vicks, Zandu, Volini, Band-Aid, Dettol)",
    category: "medicines", icon: "balm", weightKg: 0.6, baseQty: 1, volumeL: 1.2,
    transport: { cabin: "never", note: "sprays and antiseptic liquids over 100 ml aren't cabin-legal" },
    verdict: "bring-from-india",
    detail: "Indian balms, inhalers and Dettol are hard to find and comforting when you're sick alone; double-bag the Volini spray and liquids in checked baggage.",
  },

  // ── CLOTHING ──────────────────────────────────────────────────────────────────
  {
    id: "tshirts", name: "T-shirts",
    category: "clothing", icon: "tshirt", weightKg: 0.2, suggested: true, baseQty: 10, volumeL: 0.6,
    deltaBy: { climate: { warm: 2, cold: -2 } },
    minQty: 6, maxQty: 16, cabinSeed: 2,
    verdict: "bring-from-india",
    detail: "Your daily driver — pack plenty from home (they're cheap and pack flat). Warm campuses want a couple more; cold ones lean on layers instead.",
  },
  {
    id: "shorts", name: "Shorts",
    category: "clothing", icon: "shorts", weightKg: 0.2, baseQty: 5, volumeL: 0.5,
    deltaBy: { climate: { warm: 3, cold: -3 } },
    minQty: 1, maxQty: 10,
    verdict: "bring-from-india",
    detail: "Warm-campus students live in shorts; cold-climate ones need only a couple. Balance these against track pants for your destination.",
  },
  {
    id: "track-pants", name: "Track pants & joggers",
    category: "clothing", icon: "pants", weightKg: 0.35, baseQty: 8, volumeL: 1.2,
    deltaBy: { climate: { cold: 2, warm: -3 } },
    minQty: 3, maxQty: 12,
    verdict: "bring-from-india",
    detail: "Comfortable, layerable and cheap to bring — cold campuses want more, warm ones fewer.",
  },
  {
    id: "innerwear", name: "Inner wear",
    category: "clothing", icon: "tshirt", weightKg: 0.05, suggested: true, baseQty: 15, volumeL: 0.4,
    verdict: "bring-from-india",
    detail: "Light and cheap — overpack rather than pay US prices or do laundry too often in your first weeks.",
  },
  {
    id: "socks", name: "Socks (pairs)",
    category: "clothing", icon: "socks", weightKg: 0.05, suggested: true, baseQty: 12, volumeL: 0.3,
    deltaBy: { climate: { cold: 4 } },
    minQty: 8, maxQty: 20,
    verdict: "bring-from-india",
    detail: "Cold-climate winters mean thicker and more frequent socks; bring plenty since they're bulky-cheap.",
  },
  {
    id: "formal-shirts", name: "Formal shirts",
    category: "clothing", icon: "shirt", weightKg: 0.25, baseQty: 4, volumeL: 0.7,
    verdict: "bring-from-india",
    detail: "Bring at least one black and one white for presentations, conferences and interviews.",
  },
  {
    id: "jeans-chinos", name: "Jeans & chinos",
    category: "clothing", icon: "pants", weightKg: 0.6, baseQty: 6, volumeL: 1.8,
    minQty: 3, maxQty: 8,
    verdict: "bring-from-india",
    detail: "A mix of jeans and formal trousers covers most days; include at least one solid black pair.",
  },
  {
    id: "formal-suit", name: "Formal suit / blazer",
    category: "clothing", icon: "shirt", weightKg: 1.2, baseQty: 1, volumeL: 4,
    transport: { cabin: "prefer", note: "fold into a garment sleeve so it stays crisp" },
    verdict: "buy-in-us",
    detail: "For interviews and formal events — a suit tailored to fit in the US beats an ill-fitting one from home, so most students buy it there.",
  },
  {
    id: "hoodies", name: "Hoodies & sweatshirts",
    category: "clothing", icon: "hoodie", weightKg: 0.5, baseQty: 4, volumeL: 2,
    deltaBy: { climate: { warm: -2 } },
    minQty: 1, maxQty: 6,
    verdict: "buy-in-us",
    detail: "US college hoodies are cheap, warm and everywhere — bring one or two and buy the rest (including your university's) after you land.",
  },
  {
    id: "jacket", name: "Heavy weatherproof jacket",
    category: "clothing", icon: "jacket", weightKg: 1.5, baseQty: 1, volumeL: 8,
    deltaBy: { climate: { warm: -1 } },
    minQty: 0, maxQty: 1,
    verdict: "buy-in-us",
    verdictBy: { climate: { warm: "skip" }, intake: { spring: "bring-from-india" } },
    transport: { cabin: "prefer", note: "wear or carry it if you land into winter" },
    detail: "A proper US winter coat is warmer and cheaper bought there — but spring arrivals land straight into the cold, so bring one you own.",
  },
  {
    id: "thermals", name: "Thermal base layers",
    category: "clothing", icon: "tshirt", weightKg: 0.2, baseQty: 0, volumeL: 0.4,
    deltaBy: { climate: { cold: 3, mixed: 1 }, intake: { spring: 1 } },
    minQty: 0, maxQty: 6,
    visibleIf: (p) => p.climate !== "warm",
    verdict: "bring-from-india",
    detail: "Thin thermals layer under everything and are the cheapest way to survive a first US winter — spring arrivals need them from day one.",
  },
  {
    id: "winter-access", name: "Muffler, woolen cap & gloves",
    category: "clothing", icon: "gloves", weightKg: 0.4, baseQty: 0, volumeL: 1,
    deltaBy: { climate: { cold: 1 } },
    minQty: 0, maxQty: 1,
    visibleIf: (p) => p.climate !== "warm",
    verdict: "buy-in-us",
    detail: "Proper winter accessories are better and cheap in the US — bring them only if you already own them.",
  },
  {
    id: "traditional", name: "Traditional / ethnic wear", holdKey: "formal wear",
    category: "clothing", icon: "ethnic", weightKg: 0.9, baseQty: 2, volumeL: 3,
    nameFor: (p) => p.gender === "female"
      ? "Ethnic wear (saree / lehenga)"
      : "Ethnic wear (kurta / sherwani)",
  },
  {
    id: "towels", name: "Towels & hand towels",
    category: "clothing", icon: "towel", weightKg: 0.3, baseQty: 4, volumeL: 2,
    verdict: "bring-from-india",
    detail: "Two bath + two hand towels; Indian cotton towels are cheaper and lighter than what you'll grab last-minute in the US.",
  },
  {
    id: "shoes", name: "Shoes (pairs)",
    category: "clothing", icon: "shoe", weightKg: 0.9, suggested: true, baseQty: 2, volumeL: 4,
    verdict: "bring-from-india",
    detail: "One everyday pair + one formal; wear the heaviest pair on the plane to save baggage weight.",
  },
  {
    id: "flipflops", name: "Flip-flops / floaters",
    category: "clothing", icon: "shoe", weightKg: 0.3, baseQty: 2, volumeL: 1,
    verdict: "bring-from-india",
    detail: "For shared dorm bathrooms and quick errands — the Indian ones you like are hard to find.",
  },
  {
    id: "swimwear", name: "Swim wear",
    category: "clothing", icon: "shorts", weightKg: 0.15, baseQty: 1, volumeL: 0.3,
    verdict: "either",
    detail: "Campus gyms and pools are common; one pair is plenty and it packs tiny.",
  },
  {
    id: "clothing-access", name: "Belts, caps & handkerchiefs",
    category: "clothing", icon: "clothing", weightKg: 0.3, baseQty: 1, volumeL: 0.8,
    verdict: "bring-from-india",
    detail: "A couple of belts, a cap and a dozen handkerchiefs — small, useful, and easy to forget.",
  },

  // ── BEDDING ──────────────────────────────────────────────────────────────────
  {
    id: "bedsheets", name: "Bedsheets & pillow covers",
    category: "bedding", icon: "bedsheet", weightKg: 0.6, baseQty: 2, volumeL: 3,
    verdict: "bring-from-india",
    detail: "Prefer king-size sheets and a few large pillow covers; US bedding runs expensive, though check your dorm's mattress size (many are Twin XL).",
  },
  {
    id: "blanket-pillow", name: "Blanket & pillow",
    category: "bedding", icon: "pillow", weightKg: 1.5, baseQty: 1, volumeL: 10,
    verdict: "buy-in-us",
    detail: "A thick blanket and pillow are bulky and cheap in the US — bring at most a thin blanket from home and buy the rest after you arrive.",
  },

  // ── KITCHENWARE ──────────────────────────────────────────────────────────────
  {
    id: "cooker", name: "Pressure cooker (2–3 L, induction)", holdKey: "pressure cooker",
    category: "kitchen", icon: "cooker", weightKg: 2.2, baseQty: 0, volumeL: 6,
    deltaBy: { housing: { apartment: 1 }, cooking: { daily: 1, weekly: 1, rarely: -1 } },
    minQty: 0, maxQty: 1,
    verdictBy: { housing: { dorm: "skip" }, cooking: { rarely: "skip" } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
    transport: { cabin: "never", note: "pressure cookers get pulled at security; checked only. Bring spare whistles + gaskets." },
  },
  {
    id: "cookware", name: "Cookware (pan, kadai, tea pot)", holdKey: "kitchenware",
    category: "kitchen", icon: "pan", weightKg: 2.0, baseQty: 0, volumeL: 5,
    deltaBy: { housing: { apartment: 1 }, cooking: { daily: 1, weekly: 1 } },
    minQty: 0, maxQty: 1,
    verdictBy: { housing: { dorm: "skip" } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
    transport: { cabin: "never", note: "heavy metal cookware isn't cabin-friendly" },
  },
  {
    id: "tableware", name: "Steel plates, glasses & microwave bowls",
    category: "kitchen", icon: "plate", weightKg: 1.0, baseQty: 1, volumeL: 3,
    minQty: 0, maxQty: 1,
    verdict: "bring-from-india",
    detail: "A couple of lightweight steel plates and glasses plus microwave-safe bowls cover daily eating from day one; prefer light steel.",
  },
  {
    id: "cutlery", name: "Cutlery & serving spoons",
    category: "kitchen", icon: "cutlery", weightKg: 0.6, baseQty: 1, volumeL: 1.5,
    minQty: 0, maxQty: 1,
    verdict: "bring-from-india",
    detail: "Spoons, forks and a few wooden/serving ladles — a small set saves an annoying first-week shopping trip.",
  },
  {
    id: "prep-tools", name: "Prep tools (knife, peeler, grater, mashers, board)", holdKey: "kitchenware",
    category: "kitchen", icon: "knife", weightKg: 1.2, baseQty: 0, volumeL: 3,
    deltaBy: { housing: { apartment: 1 }, cooking: { daily: 1 } },
    minQty: 0, maxQty: 1,
    verdictBy: { housing: { dorm: "skip" } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
    transport: { cabin: "never", note: "knives and sharp tools are banned from the cabin — pack them deep in checked" },
  },
  {
    id: "kitchen-misc", name: "Kitchen misc (tongs, roti roller, strainer, scissors)",
    category: "kitchen", icon: "cutlery", weightKg: 0.5, baseQty: 0, volumeL: 1.5,
    deltaBy: { cooking: { daily: 1, weekly: 1 } },
    minQty: 0, maxQty: 1,
    visibleIf: (p) => p.cooking !== "rarely",
    verdict: "bring-from-india",
    detail: "Tongs (patkara), a roti roller, tea strainer and kitchen scissors are the little tools you'll miss most — checked only (scissors aren't cabin-legal).",
    transport: { cabin: "never", note: "scissors and blades can't fly in the cabin" },
  },
  {
    id: "water-bottle", name: "Water bottle",
    category: "kitchen", icon: "bottle", weightKg: 0.2, baseQty: 1, volumeL: 1,
    verdict: "either",
    detail: "Bring one reusable bottle; carry it empty through security and fill it after.",
  },

  // ── FOOD ──────────────────────────────────────────────────────────────────────
  {
    id: "ground-masalas", name: "Ground masalas (chilli, coriander, jeera, garam)", holdKey: "spices",
    category: "food", icon: "spice", weightKg: 0.3, suggested: true, baseQty: 4, volumeL: 0.6,
    deltaBy: { cooking: { rarely: -2, daily: 4, weekly: 1 }, housing: { apartment: 1 } },
    minQty: 2, maxQty: 12,
    transport: { cabin: "never", note: "powders over 350 ml face extra screening — pack them in checked, double-bagged" },
  },
  {
    id: "spice-south", name: "South Indian spice kit (sambar, rasam + podis)", holdKey: "south indian spice kit",
    category: "food", icon: "spice", weightKg: 1.4, baseQty: 1, suggested: true, volumeL: 2,
    visibleIf: (p) => p.cuisine === "south",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "spice-north", name: "North Indian spice kit (garam masala, rajma + chole)", holdKey: "north indian spice kit",
    category: "food", icon: "spice", weightKg: 1.4, baseQty: 1, suggested: true, volumeL: 2,
    visibleIf: (p) => p.cuisine === "north",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "spice-west", name: "West Indian spice kit (goda masala + dhokla mixes)", holdKey: "west indian spice kit",
    category: "food", icon: "spice", weightKg: 1.4, baseQty: 1, suggested: true, volumeL: 2,
    visibleIf: (p) => p.cuisine === "west",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "spice-east", name: "East Indian spice kit (panch phoron + mustard)", holdKey: "east indian spice kit",
    category: "food", icon: "spice", weightKg: 1.4, baseQty: 1, suggested: true, volumeL: 2,
    visibleIf: (p) => p.cuisine === "east",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "jain-masala", name: "Jain masala set (onion-garlic-free)", holdKey: "jain masala set",
    category: "food", icon: "spice", weightKg: 0.8, baseQty: 1, volumeL: 1,
    visibleIf: (p) => p.dietPractice === "jain",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "ghee", name: "Ghee (freeze before packing)",
    category: "food", icon: "ghee", weightKg: 1.0, baseQty: 1, volumeL: 1.2,
    deltaBy: { cooking: { rarely: -1 } },
    minQty: 0, maxQty: 2,
    transport: { cabin: "never", note: "counts as a liquid/gel — freeze it solid, seal well, and check it in" },
    verdict: "bring-from-india",
    detail: "Good ghee is expensive abroad; freeze it hard and double-seal so it survives the hold without leaking.",
  },
  {
    id: "gg-paste", name: "Ginger-garlic paste & wet masalas",
    category: "food", icon: "spice", weightKg: 1.0, baseQty: 0, volumeL: 1,
    deltaBy: { cooking: { daily: 1, weekly: 1 } },
    minQty: 0, maxQty: 1,
    visibleIf: (p) => p.cooking !== "rarely" && p.dietPractice !== "jain",
    transport: { cabin: "never", note: "wet pastes are liquids at security — checked only, well-sealed" },
    verdict: "bring-from-india",
    detail: "A jar or two saves daily prep in your first months; freeze and double-bag against leaks.",
  },
  {
    id: "pickles", name: "Pickles & podis (dry, double-packed)", holdKey: "pickles and podis",
    category: "food", icon: "pickle", weightKg: 0.4, baseQty: 2, volumeL: 0.6,
    transport: { cabin: "never", note: "oily and wet foods count as liquids at security" },
  },
  {
    id: "instant", name: "Instant food (Maggi, RTE, masala oats)", holdKey: "instant food",
    category: "food", icon: "instant", weightKg: 0.08, suggested: true, baseQty: 6, volumeL: 0.3,
  },
  {
    id: "snacks", name: "Home snacks & sweets (dry, sealed)", holdKey: "specialty snacks",
    category: "food", icon: "snacks", weightKg: 0.4, baseQty: 3, volumeL: 1,
  },
  {
    id: "chai-kit", name: "Chai kit (loose tea + masala)", holdKey: "chai kit",
    category: "food", icon: "chai", weightKg: 0.5, baseQty: 1, volumeL: 0.8,
    visibleIf: (p) => p.beverage === "chai" || p.beverage === "both",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "filter-coffee-kit", name: "Filter coffee kit (powder + dabara)", holdKey: "filter coffee kit",
    category: "food", icon: "coffee", weightKg: 0.7, baseQty: 1, volumeL: 1.2,
    visibleIf: (p) => p.beverage === "filter-coffee" || p.beverage === "both",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "rice-dal", name: "Rice & lentils (bridge supply, kg)",
    category: "food", icon: "rice", weightKg: 1.0, baseQty: 0, volumeL: 1.2,
    deltaBy: { cooking: { daily: 3, weekly: 1 }, housing: { apartment: 1 } },
    minQty: 0, maxQty: 5,
    verdict: "bring-from-india",
    verdictBy: { cooking: { rarely: "skip" }, housing: { dorm: "buy-in-us" } },
    detail: "A few kilos bridge your first weeks before you find an Indian store — heavy, so skip it if you're a dorm eater and buy a small bag on arrival.",
  },

  // ── TOILETRIES ────────────────────────────────────────────────────────────────
  {
    id: "toiletries", name: "Toiletries starter kit (~1 month)",
    category: "toiletries", icon: "soap", weightKg: 1.0, suggested: true, baseQty: 1, volumeL: 3,
    transport: { cabin: "never", note: "liquids over 100 ml are banned from cabin bags" },
    verdict: "bring-from-india",
    detail: "Pack a month's worth (brush, paste, soap, shampoo) so you're not shopping jet-lagged on day one; restock from US stores after that.",
  },
  {
    id: "hair-oil", name: "Hair oil",
    category: "toiletries", icon: "bottle", weightKg: 0.3, baseQty: 1, volumeL: 0.5,
    transport: { cabin: "never", note: "over 100 ml — checked only, sealed in a zip bag" },
    verdict: "bring-from-india",
    detail: "The Indian hair oils you use are hard to find and pricey abroad; one sealed bottle lasts a while.",
  },
  {
    id: "skincare", name: "Skincare & sunscreen", holdKey: "cosmetics and skincare starter",
    category: "toiletries", icon: "bottle", weightKg: 0.6, baseQty: 1, volumeL: 1,
    transport: { cabin: "never", note: "creams and liquids over 100 ml aren't cabin-safe" },
  },
  {
    id: "grooming-kit", name: "Trimmer / shaving kit", holdKey: "grooming kit",
    category: "toiletries", icon: "razor", weightKg: 0.4, baseQty: 1, volumeL: 0.8,
    visibleIf: (p) => p.gender === "male" || p.gender === "nonbinary" || p.gender === "na" || !p.gender,
    transport: { cabin: "never", note: "loose razor blades can't fly in the cabin" },
  },
  {
    id: "sanitary-supply", name: "Sanitary supply (first 2–3 months)", holdKey: "sanitary supply",
    category: "toiletries", weightKg: 0.9, baseQty: 1, volumeL: 2,
    visibleIf: (p) => p.gender === "female",
  },

  // ── STATIONERY ──────────────────────────────────────────────────────────────
  {
    id: "stationery-kit", name: "Stationery kit (pens, files, tape, stapler)",
    category: "stationery", icon: "pen", weightKg: 0.6, baseQty: 1, volumeL: 1.5,
    verdict: "either",
    detail: "A small set of pens, files and tape saves an early errand; you'll restock from campus stores, so don't overpack.",
  },
  {
    id: "textbooks", name: "Textbooks & notebooks",
    category: "stationery", icon: "book", weightKg: 1.5, baseQty: 0, volumeL: 3,
    minQty: 0, maxQty: 3,
    verdict: "either",
    detail: "Books are heavy and most are cheaper to rent/buy or read digitally in the US — bring only ones you truly need day one.",
  },

  // ── ELECTRONICS ────────────────────────────────────────────────────────────────
  {
    id: "laptop", name: "Laptop + charger", holdKey: "consumer electronics",
    category: "electronics", icon: "laptop", weightKg: 2.0, suggested: true, baseQty: 1, volumeL: 3,
    transport: { cabin: "must", note: "lithium batteries and your most valuable item belong in the cabin" },
  },
  {
    id: "phone", name: "Smartphone + charger + cables", holdKey: "consumer electronics",
    category: "electronics", icon: "phone", weightKg: 0.4, suggested: true, baseQty: 1, volumeL: 0.3,
    transport: { cabin: "must", note: "lithium batteries ride in the cabin" },
  },
  {
    id: "adapter", name: "Travel adapters + extension cord", holdKey: "universal power adapter",
    category: "electronics", icon: "adapter", weightKg: 0.3, suggested: true, baseQty: 2, volumeL: 0.4,
    transport: { cabin: "prefer", note: "you'll want to charge at layovers" },
  },
  {
    id: "powerbank", name: "Power bank (< 20000 mAh)",
    category: "electronics", icon: "powerbank", weightKg: 0.35, baseQty: 1, volumeL: 0.3,
    transport: { cabin: "must", note: "power banks are banned from checked bags — they must fly in the cabin" },
    verdict: "bring-from-india",
    detail: "A power bank under 100 Wh (~20000 mAh) is fine to bring and invaluable on travel days — it must go in your carry-on.",
  },
  {
    id: "audio", name: "Earphones / headphones",
    category: "electronics", weightKg: 0.3, baseQty: 1, volumeL: 0.5,
    transport: { cabin: "prefer", note: "you'll want them on the flight" },
    verdict: "either",
    detail: "Bring what you already own; prices are similar in the US if you'd rather upgrade there.",
  },
  {
    id: "storage", name: "Pen drive & external hard disk",
    category: "electronics", icon: "harddisk", weightKg: 0.3, baseQty: 1, volumeL: 0.3,
    transport: { cabin: "prefer", note: "keep data backups on you, not in checked bags" },
    verdict: "either",
    detail: "Handy for backups and coursework; never carry pirated or illegal data across the border.",
  },
  {
    id: "appliance", name: "Indian 220V appliance (kettle/iron)", holdKey: "electrical appliances",
    category: "electronics", weightKg: 1.5, baseQty: 0, shareable: true, volumeL: 4,
    transport: { cabin: "never", note: "heating elements get flagged at security; checked only" },
  },

  // ── MISCELLANEOUS ────────────────────────────────────────────────────────────
  {
    id: "daypack", name: "Laptop backpack",
    category: "misc", icon: "backpack", weightKg: 0.8, baseQty: 1, volumeL: 5,
    verdict: "bring-from-india",
    detail: "A big, comfortable laptop backpack doubles as your in-flight personal item and your daily campus bag.",
  },
  {
    id: "spectacles", name: "Spectacles / contacts (spares)", holdKey: "eyeglasses",
    category: "misc", icon: "glasses", weightKg: 0.05, baseQty: 4, volumeL: 0.3,
    visibleIf: (p) => p.wearsGlasses === "yes",
    transport: { cabin: "prefer", note: "fragile in checked bags, and you'll want a spare mid-flight" },
  },
  {
    id: "sunglasses-watch", name: "Sunglasses & watch",
    category: "misc", icon: "watch", weightKg: 0.15, baseQty: 1, volumeL: 0.3,
    verdict: "bring-from-india",
    detail: "Small everyday items that are easy to forget and annoying to re-buy in your first week.",
  },
  {
    id: "wallet", name: "Wallet",
    category: "misc", icon: "wallet", weightKg: 0.1, baseQty: 1, volumeL: 0.2,
    verdict: "bring-from-india",
    detail: "Carry a slim wallet with some USD, your cards and ID; keep a second stash of cash separately.",
  },
  {
    id: "umbrella", name: "Umbrella (snow-proof)",
    category: "misc", icon: "umbrella", weightKg: 0.4, baseQty: 1, volumeL: 1,
    verdict: "buy-in-us",
    detail: "A sturdy US umbrella handles wind and snow better than a light Indian one — grab it after you land.",
  },
  {
    id: "handy-kit", name: "Handy kit (sewing kit, screwdriver set, toothpicks)",
    category: "misc", icon: "tool", weightKg: 0.4, baseQty: 1, volumeL: 0.8,
    transport: { cabin: "never", note: "small blades and screwdrivers aren't cabin-legal" },
    verdict: "bring-from-india",
    detail: "A tiny sewing kit and mini tool set fix clothes and assemble furniture cheaply — worth the small weight.",
  },

  // ── MONEY ──────────────────────────────────────────────────────────────────────
  {
    id: "forex", name: "Forex card + emergency USD cash", holdKey: "cash (usd)",
    category: "money", icon: "wallet", weightKg: 0.1, suggested: true, baseQty: 1, volumeL: 0.05,
    transport: { cabin: "must", note: "cash and cards never go in checked bags" },
  },
];
