import type { PackingItem } from "./types";

/**
 * Concrete, packable line-items for The Manifest + Weigh-In.
 * Each links to a canonical verdict in The Hold via `holdKey`.
 * Weights are rough estimates (kg) to drive the Weigh-In simulator.
 * This list is hand-curated for v0 — later it can be generated from The Hold
 * and adjusted by community Debrief data.
 */
export const PACKING_ITEMS: PackingItem[] = [
  // documents
  { id: "passport", name: "Passport, I-20 & document folder", holdKey: "documents", category: "documents", weightKg: 0.4, suggested: true },
  { id: "doc-copies", name: "Photocopies + scanned backups", holdKey: "documents", category: "documents", weightKg: 0.2, suggested: true },
  { id: "photos", name: "Passport-size photos (10+)", holdKey: "documents", category: "documents", weightKg: 0.05, suggested: true },

  // medicines
  { id: "rx", name: "Prescription meds (1-2 months) + doctor's letter", holdKey: "prescription medicines", category: "medicines", weightKg: 0.5, suggested: true },
  { id: "otc-kit", name: "OTC medicine starter kit", holdKey: "otc medicines", category: "medicines", weightKg: 0.4, suggested: true },
  { id: "glasses", name: "Spare eyeglasses (2 pairs) / contacts", holdKey: "eyeglasses", category: "medicines", weightKg: 0.2, suggested: true },

  // clothing
  { id: "transit-jacket", name: "Light / transit jacket", holdKey: "winter jacket", category: "clothing", weightKg: 0.8, suggested: true },
  { id: "thermals", name: "Thermal base layers (x3)", holdKey: "winter jacket", category: "clothing", weightKg: 0.6, suggested: true },
  { id: "heavy-coat", name: "Heavy winter down coat", holdKey: "winter jacket", category: "clothing", weightKg: 1.8 },
  { id: "everyday-clothes", name: "Everyday clothes (~2 weeks)", holdKey: "branded clothing", category: "clothing", weightKg: 4.5, suggested: true },
  { id: "shoes", name: "Shoes (2 pairs)", holdKey: "branded clothing", category: "clothing", weightKg: 1.8, suggested: true },
  { id: "formal", name: "Formal outfit (suit / blazer)", holdKey: "formal wear", category: "clothing", weightKg: 1.0, suggested: true },
  { id: "ethnic", name: "Ethnic wear (kurta / saree / sherwani)", holdKey: "formal wear", category: "clothing", weightKg: 0.9 },

  // kitchen
  { id: "cooker", name: "Pressure cooker (3 L)", holdKey: "pressure cooker", category: "kitchen", weightKg: 2.2 },
  { id: "tava", name: "Flat tava / griddle", holdKey: "kitchenware", category: "kitchen", weightKg: 1.1 },
  { id: "kitchen-basics", name: "Light kitchen basics (knife, strainer, masala box)", holdKey: "kitchenware", category: "kitchen", weightKg: 1.0, suggested: true },

  // food
  { id: "spices", name: "Dry spices & masalas (sealed)", holdKey: "spices", category: "food", weightKg: 1.5, suggested: true },
  { id: "instant", name: "Instant food (Maggi, ready-to-eat x12)", holdKey: "instant food", category: "food", weightKg: 1.0, suggested: true },
  { id: "snacks", name: "Home snacks (dry, sealed)", holdKey: "specialty snacks", category: "food", weightKg: 1.2 },
  { id: "rice-dal", name: "Rice & lentils (bridge supply)", holdKey: "rice and lentils", category: "food", weightKg: 5.0 },

  // electronics
  { id: "laptop", name: "Laptop (your existing) + charger", holdKey: "consumer electronics", category: "electronics", weightKg: 2.0, suggested: true },
  { id: "phone", name: "Phone + charger + cables", holdKey: "consumer electronics", category: "electronics", weightKg: 0.5, suggested: true },
  { id: "adapter", name: "Universal adapter + power strip", holdKey: "universal power adapter", category: "electronics", weightKg: 0.4, suggested: true },
  { id: "appliance", name: "Indian 220V appliance (kettle/iron)", holdKey: "electrical appliances", category: "electronics", weightKg: 1.5 },

  // bedding
  { id: "bedding", name: "Bedsheets / pillow / blanket", holdKey: "bedding", category: "bedding", weightKg: 2.5 },

  // toiletries
  { id: "toiletries", name: "Toiletries starter kit (~1 month)", holdKey: "toiletries", category: "toiletries", weightKg: 1.0, suggested: true },
  { id: "stationery", name: "Stationery & textbooks", holdKey: "stationery and textbooks", category: "toiletries", weightKg: 2.0 },

  // money
  { id: "forex", name: "Forex card + emergency USD cash", holdKey: "cash (usd)", category: "money", weightKg: 0.1, suggested: true },
];
