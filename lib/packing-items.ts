import type { PackingItem } from "./types";

/**
 * Concrete, packable line-items for The Manifest + Weigh-In.
 * Each links to a canonical verdict in The Hold via `holdKey`.
 * weightKg is *per unit*; Weigh-In multiplies by the user's chosen qty.
 *
 * `baseQty` = default recommended count when no profile override applies.
 * `qtyBy`   = profile overrides in the precedence defined by recommendedQty().
 *             The user can always override in the Manifest stepper.
 * `volumeL` = rough per-unit packed volume (litres) for space meters + Auto-Pack.
 * `transport` = airline/TSA rule: cabin "must" (documents, lithium, meds),
 *             "never" (blades, cookers, liquids >100 ml, bulk powders), "prefer".
 * `cabinSeed` = units Auto-Pack seeds into the cabin for resilience.
 *
 * Rules of thumb driving the numbers below:
 *   - clothing: cold-climate cohorts pack more layers; warm-climate cohorts skip winter
 *   - kitchen/food: apartment + cooks-a-lot cohorts pack more; dorm + eats-out skips
 *   - Fall arrivals have time to buy heavy winter gear in the US; Spring arrivals need it day one
 */
export const PACKING_ITEMS: PackingItem[] = [
  // documents — always 1
  {
    id: "passport", name: "Passport, I-20 & document folder", holdKey: "documents",
    category: "documents", weightKg: 0.4, suggested: true, baseQty: 1, volumeL: 0.5,
    transport: { cabin: "must", note: "originals stay on your person, never in checked bags" },
  },
  {
    id: "doc-copies", name: "Photocopies + scanned backups", holdKey: "documents",
    category: "documents", weightKg: 0.2, suggested: true, baseQty: 1, volumeL: 0.3,
  },
  { id: "photos", name: "Passport-size photos", holdKey: "documents", category: "documents", weightKg: 0.05, suggested: true, baseQty: 10, volumeL: 0.01 },

  // medicines
  {
    id: "rx", name: "Prescription meds (1-2 months) + doctor's letter", holdKey: "prescription medicines",
    category: "medicines", weightKg: 0.5, suggested: true, baseQty: 1, volumeL: 0.8,
    transport: { cabin: "must", note: "TSA wants medicines in the carry-on, with the doctor's letter" },
  },
  {
    id: "otc-kit", name: "OTC medicine starter kit", holdKey: "otc medicines",
    category: "medicines", weightKg: 0.4, suggested: true, baseQty: 1, volumeL: 1.2,
    transport: { cabin: "never", note: "syrups and liquids over 100 ml aren't allowed in the cabin" },
  },
  {
    id: "glasses", name: "Spare eyeglasses / contacts", holdKey: "eyeglasses",
    category: "medicines", weightKg: 0.2, suggested: true, baseQty: 2, volumeL: 0.3,
    transport: { cabin: "prefer", note: "fragile in checked bags, and you'll want them mid-flight" },
  },

  // clothing — the flagship profile-varying section
  {
    id: "transit-jacket", name: "Light / transit jacket", holdKey: "winter jacket",
    category: "clothing", weightKg: 0.8, suggested: true, baseQty: 1, volumeL: 3,
    deltaBy: { climate: { warm: -1, cold: 0, mixed: 0 } },
    minQty: 0, maxQty: 1,
    verdictBy: { climate: { warm: "skip" } },
    transport: { cabin: "prefer", note: "or just wear it on the plane" },
  },
  {
    id: "thermals", name: "Thermal base layers", holdKey: "winter jacket",
    category: "clothing", weightKg: 0.2, suggested: true, baseQty: 2, volumeL: 0.4,
    deltaBy: {
      climate: { warm: -2, cold: 3, mixed: 0 },
      intake: { spring: 1 },
    },
    minQty: 0, maxQty: 6,
    verdictBy: { climate: { warm: "skip" } },
  },
  {
    id: "heavy-coat", name: "Heavy winter down coat", holdKey: "winter jacket",
    category: "clothing", weightKg: 1.8, baseQty: 1, volumeL: 8,
    visibleIf: (p) => p.climate === "cold" && p.intake === "spring",
    verdictBy: {
      climate: { warm: "skip" },
      intake: { fall: "buy-in-us" },
    },
    transport: { cabin: "prefer", note: "wear or carry it — you land into winter" },
  },
  {
    id: "everyday-clothes", name: "Everyday clothes (per set)", holdKey: "branded clothing",
    category: "clothing", weightKg: 0.4, suggested: true, baseQty: 10, volumeL: 2.5,
    deltaBy: {
      climate: { cold: 2, warm: -1 },
      housing: { apartment: 2 },
      roommates: { alone: 1 },
    },
    minQty: 7, maxQty: 18,
    cabinSeed: 2,
  },
  { id: "shoes", name: "Pairs of shoes", holdKey: "branded clothing", category: "clothing", weightKg: 0.9, suggested: true, baseQty: 2, volumeL: 4 },
  { id: "formal", name: "Formal outfit (suit / blazer)", holdKey: "formal wear", category: "clothing", weightKg: 1.0, suggested: true, baseQty: 1, volumeL: 4 },
  {
    id: "ethnic", name: "Ethnic wear (kurta / saree / sherwani)", holdKey: "formal wear",
    category: "clothing", weightKg: 0.9, baseQty: 1, volumeL: 3,
    nameFor: (p) => p.gender === "female"
      ? "Ethnic wear (saree / lehenga)"
      : "Ethnic wear (kurta / sherwani)",
  },

  // kitchen — housing + diet drive most of the variation
  {
    id: "cooker", name: "Pressure cooker (3 L)", holdKey: "pressure cooker",
    category: "kitchen", weightKg: 2.2, baseQty: 0, volumeL: 6,
    deltaBy: {
      housing: { apartment: 1 },
      cooking: { daily: 1, weekly: 1, rarely: -1 },
    },
    minQty: 0, maxQty: 1,
    verdictBy: { housing: { dorm: "skip" }, cooking: { rarely: "skip" } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
    transport: { cabin: "never", note: "pressure cookers get pulled at security; checked only" },
  },
  {
    id: "tava", name: "Flat tava / griddle", holdKey: "kitchenware",
    category: "kitchen", weightKg: 1.1, baseQty: 0, volumeL: 2,
    deltaBy: { housing: { apartment: 1 }, cooking: { daily: 1 } },
    minQty: 0, maxQty: 1,
    verdictBy: { housing: { dorm: "skip" } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
    transport: { cabin: "never", note: "heavy metal cookware isn't cabin-friendly" },
  },
  {
    id: "kitchen-basics", name: "Light kitchen basics (knife, strainer, masala box)", holdKey: "kitchenware",
    category: "kitchen", weightKg: 1.0, suggested: true, baseQty: 0, volumeL: 3,
    deltaBy: { housing: { apartment: 1 }, cooking: { daily: 1, weekly: 1 } },
    minQty: 0, maxQty: 1,
    verdictBy: { housing: { dorm: "skip" } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
    transport: { cabin: "never", note: "knives and sharp tools are banned from the cabin" },
  },

  {
    id: "filter-coffee-kit", name: "Filter coffee kit (powder + dabara)", holdKey: "filter coffee kit",
    category: "kitchen", weightKg: 0.7, baseQty: 1, volumeL: 1.2,
    visibleIf: (p) => p.beverage === "filter-coffee" || p.beverage === "both",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "chai-kit", name: "Chai kit (loose tea + masala)", holdKey: "chai kit",
    category: "food", weightKg: 0.5, baseQty: 1, volumeL: 0.8,
    visibleIf: (p) => p.beverage === "chai" || p.beverage === "both",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },

  // food
  {
    id: "spices", name: "Dry spices & masalas (bags)", holdKey: "spices",
    category: "food", weightKg: 0.3, suggested: true, baseQty: 4, volumeL: 0.5,
    deltaBy: {
      cooking: { rarely: -2, daily: 4, weekly: 1 },
      housing: { apartment: 1 },
    },
    minQty: 2, maxQty: 12,
    visibleIf: (p) => !p.cuisine,
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "spice-south", name: "South Indian spice kit (sambar, rasam + podis)", holdKey: "south indian spice kit",
    category: "food", weightKg: 1.4, baseQty: 1, suggested: true, volumeL: 2,
    visibleIf: (p) => p.cuisine === "south",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "spice-north", name: "North Indian spice kit (garam masala, rajma + chole)", holdKey: "north indian spice kit",
    category: "food", weightKg: 1.4, baseQty: 1, suggested: true, volumeL: 2,
    visibleIf: (p) => p.cuisine === "north",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "spice-west", name: "West Indian spice kit (goda masala + dhokla mixes)", holdKey: "west indian spice kit",
    category: "food", weightKg: 1.4, baseQty: 1, suggested: true, volumeL: 2,
    visibleIf: (p) => p.cuisine === "west",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "spice-east", name: "East Indian spice kit (panch phoron + mustard)", holdKey: "east indian spice kit",
    category: "food", weightKg: 1.4, baseQty: 1, suggested: true, volumeL: 2,
    visibleIf: (p) => p.cuisine === "east",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "jain-masala", name: "Jain masala set (onion-garlic-free)", holdKey: "jain masala set",
    category: "food", weightKg: 0.8, baseQty: 1, volumeL: 1,
    visibleIf: (p) => p.dietPractice === "jain",
    transport: { cabin: "never", note: "powders over 350 ml face extra screening in the cabin" },
  },
  {
    id: "pickles-podis", name: "Pickles & podis (dry, sealed)", holdKey: "pickles and podis",
    category: "food", weightKg: 0.4, baseQty: 2, volumeL: 0.6,
    visibleIf: (p) => p.cooking !== "rarely",
    transport: { cabin: "never", note: "oily and wet foods count as liquids at security" },
  },
  { id: "instant", name: "Instant food packets (Maggi, RTE)", holdKey: "instant food", category: "food", weightKg: 0.08, suggested: true, baseQty: 12, volumeL: 0.3 },
  { id: "snacks", name: "Home snacks (bags, dry & sealed)", holdKey: "specialty snacks", category: "food", weightKg: 0.4, baseQty: 3, volumeL: 1 },
  {
    id: "rice-dal", name: "Rice & lentils (bridge supply, kg)", holdKey: "rice and lentils",
    category: "food", weightKg: 1.0, baseQty: 0, volumeL: 1.2,
    deltaBy: {
      cooking: { daily: 3, weekly: 1 },
      housing: { apartment: 1 },
    },
    minQty: 0, maxQty: 5,
    verdictBy: { cooking: { rarely: "skip" }, housing: { dorm: "buy-in-us" } },
  },

  // electronics
  {
    id: "laptop", name: "Laptop + charger", holdKey: "consumer electronics",
    category: "electronics", weightKg: 2.0, suggested: true, baseQty: 1, volumeL: 3,
    transport: { cabin: "must", note: "lithium batteries and your most valuable item belong in the cabin" },
  },
  {
    id: "phone", name: "Phone + charger + cables", holdKey: "consumer electronics",
    category: "electronics", weightKg: 0.5, suggested: true, baseQty: 1, volumeL: 0.3,
    transport: { cabin: "must", note: "lithium batteries ride in the cabin" },
  },
  {
    id: "adapter", name: "Universal adapter / power strip", holdKey: "universal power adapter",
    category: "electronics", weightKg: 0.2, suggested: true, baseQty: 2, volumeL: 0.3,
    transport: { cabin: "prefer", note: "you'll want to charge at layovers" },
  },
  {
    id: "appliance", name: "Indian 220V appliance (kettle/iron)", holdKey: "electrical appliances",
    category: "electronics", weightKg: 1.5, baseQty: 0, shareable: true, volumeL: 4,
    transport: { cabin: "never", note: "heating elements get flagged at security; checked only" },
  },

  // bedding — dorm students need Twin XL, buy in US
  { id: "bedding", name: "Bedsheets / pillow / blanket set", holdKey: "bedding", category: "bedding", weightKg: 2.5, baseQty: 0, volumeL: 12 },

  // toiletries
  {
    id: "toiletries", name: "Toiletries starter kit (~1 month)", holdKey: "toiletries",
    category: "toiletries", weightKg: 1.0, suggested: true, baseQty: 1, volumeL: 3,
    transport: { cabin: "never", note: "liquids over 100 ml are banned from cabin bags" },
  },
  {
    id: "grooming-kit", name: "Trimmer / grooming kit", holdKey: "grooming kit",
    category: "toiletries", weightKg: 0.4, baseQty: 1, volumeL: 0.8,
    visibleIf: (p) => p.gender === "male" || p.gender === "nonbinary" || p.gender === "na",
    transport: { cabin: "never", note: "razor blades can't fly in the cabin" },
  },
  {
    id: "skincare-starter", name: "Cosmetics & skincare starter", holdKey: "cosmetics and skincare starter",
    category: "toiletries", weightKg: 0.8, baseQty: 1, volumeL: 1,
    visibleIf: (p) => p.gender === "female" || p.gender === "nonbinary",
    transport: { cabin: "never", note: "creams and liquids over 100 ml aren't cabin-safe" },
  },
  {
    id: "sanitary-supply", name: "Sanitary supply (first 2–3 months)", holdKey: "sanitary supply",
    category: "toiletries", weightKg: 0.9, baseQty: 1, volumeL: 2,
    visibleIf: (p) => p.gender === "female",
  },
  { id: "stationery", name: "Stationery & textbooks", holdKey: "stationery and textbooks", category: "toiletries", weightKg: 2.0, baseQty: 0, volumeL: 4 },

  // money
  {
    id: "forex", name: "Forex card + emergency USD cash", holdKey: "cash (usd)",
    category: "money", weightKg: 0.1, suggested: true, baseQty: 1, volumeL: 0.05,
    transport: { cabin: "must", note: "cash and cards never go in checked bags" },
  },
];
