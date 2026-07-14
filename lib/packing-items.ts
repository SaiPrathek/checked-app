import type { PackingItem } from "./types";

/**
 * Concrete, packable line-items for The Manifest + Weigh-In.
 * Each links to a canonical verdict in The Hold via `holdKey`.
 * weightKg is *per unit*; Weigh-In multiplies by the user's chosen quantity.
 *
 * `baseQty` = default recommended count when no profile override applies.
 * `qtyBy`   = profile overrides in the precedence defined by recommendedQty().
 *             The user can always override in the Manifest stepper.
 *
 * Rules of thumb driving the numbers below:
 *   - clothing: cold-climate cohorts pack more layers; warm-climate cohorts skip winter
 *   - kitchen/food: apartment + cooks-a-lot cohorts pack more; dorm + eats-out skips
 *   - Fall arrivals have time to buy heavy winter gear in the US; Spring arrivals need it day one
 */
export const PACKING_ITEMS: PackingItem[] = [
  // documents — always 1
  { id: "passport", name: "Passport, I-20 & document folder", holdKey: "documents", category: "documents", weightKg: 0.4, suggested: true, baseQty: 1 },
  { id: "doc-copies", name: "Photocopies + scanned backups", holdKey: "documents", category: "documents", weightKg: 0.2, suggested: true, baseQty: 1 },
  { id: "photos", name: "Passport-size photos", holdKey: "documents", category: "documents", weightKg: 0.05, suggested: true, baseQty: 10 },

  // medicines
  { id: "rx", name: "Prescription meds (1-2 months) + doctor's letter", holdKey: "prescription medicines", category: "medicines", weightKg: 0.5, suggested: true, baseQty: 1 },
  { id: "otc-kit", name: "OTC medicine starter kit", holdKey: "otc medicines", category: "medicines", weightKg: 0.4, suggested: true, baseQty: 1 },
  { id: "glasses", name: "Spare eyeglasses / contacts", holdKey: "eyeglasses", category: "medicines", weightKg: 0.2, suggested: true, baseQty: 2 },

  // clothing — the flagship profile-varying section
  {
    id: "transit-jacket", name: "Light / transit jacket", holdKey: "winter jacket",
    category: "clothing", weightKg: 0.8, suggested: true, baseQty: 1,
    qtyBy: { climate: { warm: 0, cold: 1, mixed: 1 } },
  },
  {
    id: "thermals", name: "Thermal base layers", holdKey: "winter jacket",
    category: "clothing", weightKg: 0.2, suggested: true, baseQty: 3,
    qtyBy: { climate: { warm: 0, cold: 5, mixed: 2 } },
  },
  {
    id: "heavy-coat", name: "Heavy winter down coat", holdKey: "winter jacket",
    category: "clothing", weightKg: 1.8, baseQty: 1,
    visibleIf: (p) => p.climate === "cold" && p.intake === "spring",
  },
  { id: "everyday-clothes", name: "Everyday clothes (per set)", holdKey: "branded clothing", category: "clothing", weightKg: 0.4, suggested: true, baseQty: 14 },
  { id: "shoes", name: "Pairs of shoes", holdKey: "branded clothing", category: "clothing", weightKg: 0.9, suggested: true, baseQty: 2 },
  { id: "formal", name: "Formal outfit (suit / blazer)", holdKey: "formal wear", category: "clothing", weightKg: 1.0, suggested: true, baseQty: 1 },
  {
    id: "ethnic", name: "Ethnic wear (kurta / saree / sherwani)", holdKey: "formal wear",
    category: "clothing", weightKg: 0.9, baseQty: 1,
    nameFor: (p) => p.gender === "female"
      ? "Ethnic wear (saree / lehenga)"
      : "Ethnic wear (kurta / sherwani)",
  },

  // kitchen — housing + diet drive most of the variation
  {
    id: "cooker", name: "Pressure cooker (3 L)", holdKey: "pressure cooker",
    category: "kitchen", weightKg: 2.2, baseQty: 0,
    qtyBy: { housing: { dorm: 0, apartment: 1 }, cooking: { rarely: 0, daily: 1, weekly: 1 } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
  },
  {
    id: "tava", name: "Flat tava / griddle", holdKey: "kitchenware",
    category: "kitchen", weightKg: 1.1, baseQty: 0,
    qtyBy: { housing: { dorm: 0, apartment: 1 } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
  },
  {
    id: "kitchen-basics", name: "Light kitchen basics (knife, strainer, masala box)", holdKey: "kitchenware",
    category: "kitchen", weightKg: 1.0, suggested: true, baseQty: 1,
    qtyBy: { housing: { dorm: 0, apartment: 1 } },
    visibleIf: (p) => p.cooking !== "rarely",
    shareable: true,
  },

  {
    id: "filter-coffee-kit", name: "Filter coffee kit (powder + dabara)", holdKey: "filter coffee kit",
    category: "kitchen", weightKg: 0.7, baseQty: 1,
    visibleIf: (p) => p.beverage === "filter-coffee" || p.beverage === "both",
  },
  {
    id: "chai-kit", name: "Chai kit (loose tea + masala)", holdKey: "chai kit",
    category: "food", weightKg: 0.5, baseQty: 1,
    visibleIf: (p) => p.beverage === "chai" || p.beverage === "both",
  },

  // food
  {
    id: "spices", name: "Dry spices & masalas (bags)", holdKey: "spices",
    category: "food", weightKg: 0.3, suggested: true, baseQty: 5,
    qtyBy: { cooking: { rarely: 2, daily: 8, weekly: 5 } },
    visibleIf: (p) => !p.cuisine,
  },
  {
    id: "spice-south", name: "South Indian spice kit (sambar, rasam + podis)", holdKey: "south indian spice kit",
    category: "food", weightKg: 1.4, baseQty: 1, suggested: true,
    visibleIf: (p) => p.cuisine === "south",
  },
  {
    id: "spice-north", name: "North Indian spice kit (garam masala, rajma + chole)", holdKey: "north indian spice kit",
    category: "food", weightKg: 1.4, baseQty: 1, suggested: true,
    visibleIf: (p) => p.cuisine === "north",
  },
  {
    id: "spice-west", name: "West Indian spice kit (goda masala + dhokla mixes)", holdKey: "west indian spice kit",
    category: "food", weightKg: 1.4, baseQty: 1, suggested: true,
    visibleIf: (p) => p.cuisine === "west",
  },
  {
    id: "spice-east", name: "East Indian spice kit (panch phoron + mustard)", holdKey: "east indian spice kit",
    category: "food", weightKg: 1.4, baseQty: 1, suggested: true,
    visibleIf: (p) => p.cuisine === "east",
  },
  {
    id: "jain-masala", name: "Jain masala set (onion-garlic-free)", holdKey: "jain masala set",
    category: "food", weightKg: 0.8, baseQty: 1,
    visibleIf: (p) => p.dietPractice === "jain",
  },
  {
    id: "pickles-podis", name: "Pickles & podis (dry, sealed)", holdKey: "pickles and podis",
    category: "food", weightKg: 0.4, baseQty: 2,
    visibleIf: (p) => p.cooking !== "rarely",
  },
  { id: "instant", name: "Instant food packets (Maggi, RTE)", holdKey: "instant food", category: "food", weightKg: 0.08, suggested: true, baseQty: 12 },
  { id: "snacks", name: "Home snacks (bags, dry & sealed)", holdKey: "specialty snacks", category: "food", weightKg: 0.4, baseQty: 3 },
  {
    id: "rice-dal", name: "Rice & lentils (bridge supply, kg)", holdKey: "rice and lentils",
    category: "food", weightKg: 1.0, baseQty: 0,
    qtyBy: { cooking: { rarely: 0, daily: 3, weekly: 0 } },
  },

  // electronics
  { id: "laptop", name: "Laptop + charger", holdKey: "consumer electronics", category: "electronics", weightKg: 2.0, suggested: true, baseQty: 1 },
  { id: "phone", name: "Phone + charger + cables", holdKey: "consumer electronics", category: "electronics", weightKg: 0.5, suggested: true, baseQty: 1 },
  { id: "adapter", name: "Universal adapter / power strip", holdKey: "universal power adapter", category: "electronics", weightKg: 0.2, suggested: true, baseQty: 2 },
  {
    id: "appliance", name: "Indian 220V appliance (kettle/iron)", holdKey: "electrical appliances",
    category: "electronics", weightKg: 1.5, baseQty: 0, shareable: true,
  },

  // bedding — dorm students need Twin XL, buy in US
  { id: "bedding", name: "Bedsheets / pillow / blanket set", holdKey: "bedding", category: "bedding", weightKg: 2.5, baseQty: 0 },

  // toiletries
  { id: "toiletries", name: "Toiletries starter kit (~1 month)", holdKey: "toiletries", category: "toiletries", weightKg: 1.0, suggested: true, baseQty: 1 },
  {
    id: "grooming-kit", name: "Trimmer / grooming kit", holdKey: "grooming kit",
    category: "toiletries", weightKg: 0.4, baseQty: 1,
    visibleIf: (p) => p.gender === "male" || p.gender === "nonbinary" || p.gender === "na",
  },
  {
    id: "skincare-starter", name: "Cosmetics & skincare starter", holdKey: "cosmetics and skincare starter",
    category: "toiletries", weightKg: 0.8, baseQty: 1,
    visibleIf: (p) => p.gender === "female" || p.gender === "nonbinary",
  },
  {
    id: "sanitary-supply", name: "Sanitary supply (first 2–3 months)", holdKey: "sanitary supply",
    category: "toiletries", weightKg: 0.9, baseQty: 1,
    visibleIf: (p) => p.gender === "female",
  },
  { id: "stationery", name: "Stationery & textbooks", holdKey: "stationery and textbooks", category: "toiletries", weightKg: 2.0, baseQty: 0 },

  // money
  { id: "forex", name: "Forex card + emergency USD cash", holdKey: "cash (usd)", category: "money", weightKg: 0.1, suggested: true, baseQty: 1 },
];
