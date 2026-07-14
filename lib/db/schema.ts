import {
  pgTable,
  text,
  boolean,
  timestamp,
  jsonb,
  numeric,
  serial,
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
  climate: text("climate"), // cold | warm | mixed
  intake: text("intake"), // fall | spring
  housing: text("housing"), // dorm | apartment
  diet: text("diet"), // veg-cooking-heavy | eats-out | mixed
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
    bag: text("bag"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.itemId] }) }),
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
export const debriefResponses = pgTable("debrief_responses", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  item: text("item").notNull(),
  verdict: text("verdict").notNull(),
  note: text("note"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});
