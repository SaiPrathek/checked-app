import {
  pgTable,
  text,
  boolean,
  timestamp,
  jsonb,
  numeric,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * users — one row per Clerk-authenticated user.
 * Clerk owns the identity; we mirror the userId + email so we can foreign-key from app tables.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id (user_...)
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * profiles — the Check-In answers, one row per user.
 */
export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  university: text("university"),
  city: text("city"),
  state: text("state"),
  region: text("region"), // northeast | midwest | south | west
  climate: text("climate"), // cold | warm | mixed
  intake: text("intake"), // fall | spring
  housing: text("housing"), // dorm | apartment
  roommates: text("roommates"), // alone | roommates
  gender: text("gender"), // male | female | nonbinary | na
  dietPractice: text("diet_practice"), // veg | jain | halal | eggetarian | none
  cuisine: text("cuisine"), // south | north | west | east
  cooking: text("cooking"), // daily | weekly | rarely
  beverage: text("beverage"), // filter-coffee | chai | both | none
  workExperience: text("work_experience"), // yes | no
  wearsGlasses: text("wears_glasses"), // yes | no
  license: text("license"), // yes | no
  diet: text("diet"), // legacy; retained for read-time migration
  /** Weigh-In fleet: which bags are active, e.g. ["bag1","cabin","backpack"]. */
  bagConfig: jsonb("bag_config"),
  completed: boolean("completed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * list_items — user's Manifest selections and bag assignments.
 * itemId references PACKING_ITEMS.id (kept in code, not DB — the catalog is static v0).
 * bag: null | "bag1" | "bag2" | "cabin"
 */
export const listItems = pgTable(
  "list_items",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    /** How many of this item the user plans to pack; drives weight × qty. */
    qty: integer("qty").notNull().default(1),
    /** Legacy single-bag assignment; superseded by allocation. Read-only for migration. */
    bag: text("bag"),
    /** Per-bag unit split, e.g. {"bag1":8,"bag2":6}. Null = unpacked (or legacy bag). */
    allocation: jsonb("allocation"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.itemId] }) }),
);

/**
 * custom_items — user-defined items that live alongside the static PACKING_ITEMS.
 * id is the "custom:<slug>" string used as itemId in list_items.
 */
export const customItems = pgTable(
  "custom_items",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    weightKg: numeric("weight_kg").notNull(),
    volumeL: numeric("volume_l"),
    transport: jsonb("transport"),
    verdict: text("verdict"),
    note: text("note"),
    aiFilled: boolean("ai_filled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.id] }) }),
);

/**
 * ─────────────────────────────────────────────────────────────
 * The Hold (corpus) mirrored into DB so we can query verdicts by
 * SQL and later aggregate community stats from debrief_responses.
 * Seeded from corpus/*.json via scripts/seed.ts.
 * ─────────────────────────────────────────────────────────────
 */
export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  quality: text("quality").notNull(), // primary | blog | forum | secondary
  publishDate: text("publish_date"),
  note: text("note"),
  verified: boolean("verified").notNull().default(false),
});

export const holdItems = pgTable("hold_items", {
  item: text("item").primaryKey(),
  category: text("category").notNull(),
  verdict: text("verdict").notNull(),
  confidence: text("confidence").notNull(),
  contested: boolean("contested").notNull().default(false),
  detail: text("detail").notNull(),
  priceNote: text("price_note"),
  priceInr: numeric("price_inr"),
  priceUsd: numeric("price_usd"),
  weightNote: text("weight_note"),
  context: jsonb("context"),
  support: jsonb("support"),
  claimIds: jsonb("claim_ids"),
  tags: jsonb("tags"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const claims = pgTable("claims", {
  id: text("id").primaryKey(),
  item: text("item").notNull(),
  category: text("category").notNull(),
  verdict: text("verdict").notNull(),
  sourceId: text("source_id").references(() => sources.id),
  quote: text("quote"),
  reasoning: text("reasoning"),
  confidence: text("confidence"),
  importance: text("importance"),
  price: jsonb("price"),
  weightNote: text("weight_note"),
  context: jsonb("context"),
});

/**
 * debrief_responses — the flywheel. Filled by the Debrief prompt after arrival.
 * verdict: worth-it | useless | should-buy-there | wish-brought-more
 * Schema ready; UI comes in Phase 3.
 */
/**
 * debrief_responses — one row per (user, item). Users can revise, so use
 * upsert against the composite pk. verdict ∈ {"worth-it" | "useless" |
 * "should-buy-there" | "wish-brought-more"}.
 */
export const debriefResponses = pgTable(
  "debrief_responses",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    item: text("item").notNull(),
    verdict: text("verdict").notNull(),
    note: text("note"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.item] }) }),
);
