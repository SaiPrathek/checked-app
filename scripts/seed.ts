import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sources, holdItems, claims } from "@/lib/db/schema";
import { sql as drSql } from "drizzle-orm";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");

const neonSql = neon(process.env.DATABASE_URL);
const db = drizzle(neonSql);

interface Src { id: string; url: string; title: string; quality: string; publishDate?: string; note?: string; verified?: boolean }
interface Item {
  item: string; category: string; verdict: string; confidence: string; contested: boolean;
  detail: string; support?: Record<string, number>; claimIds?: string[];
  context?: unknown; price?: { inr?: number|null; usd?: number|null; note?: string } | null; weightNote?: string | null;
}
interface Claim {
  id: string; item: string; category: string; verdict: string;
  sourceId?: string; quote?: string; reasoning?: string; confidence?: string; importance?: string;
  price?: unknown; weightNote?: string | null; context?: unknown;
}

function load<T>(rel: string): T {
  const path = resolve(process.cwd(), rel);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

async function main() {
  const sourcesJson = load<{ sources: Src[] }>("corpus/sources.json");
  const itemsJson = load<{ items: Item[] }>("corpus/seed-items.json");
  const claimsJson = load<{ claims: Claim[] }>("corpus/seed-claims.json");

  console.log(`Loaded corpus: ${sourcesJson.sources.length} sources · ${itemsJson.items.length} items · ${claimsJson.claims.length} claims`);

  // Wipe existing seed rows so re-runs are idempotent (users/list_items untouched).
  await db.execute(drSql`TRUNCATE TABLE claims, hold_items, sources RESTART IDENTITY CASCADE`);

  await db.insert(sources).values(
    sourcesJson.sources.map((s) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      quality: s.quality,
      publishDate: s.publishDate ?? null,
      note: s.note ?? null,
      verified: s.verified ?? false,
    })),
  );
  console.log(`  ✓ inserted ${sourcesJson.sources.length} sources`);

  await db.insert(holdItems).values(
    itemsJson.items.map((it) => ({
      item: it.item,
      category: it.category,
      verdict: it.verdict,
      confidence: it.confidence,
      contested: it.contested,
      detail: it.detail,
      priceNote: it.price?.note ?? null,
      priceInr: it.price?.inr != null ? String(it.price.inr) : null,
      priceUsd: it.price?.usd != null ? String(it.price.usd) : null,
      weightNote: it.weightNote ?? null,
      context: (it.context ?? null) as unknown,
      support: (it.support ?? null) as unknown,
      claimIds: (it.claimIds ?? null) as unknown,
    })),
  );
  console.log(`  ✓ inserted ${itemsJson.items.length} hold_items`);

  // claims may reference sourceIds not in the sources table (research artifacts); skip those.
  const knownSources = new Set(sourcesJson.sources.map((s) => s.id));
  const cleanedClaims = claimsJson.claims.map((c) => ({
    id: c.id,
    item: c.item,
    category: c.category,
    verdict: c.verdict,
    sourceId: c.sourceId && knownSources.has(c.sourceId) ? c.sourceId : null,
    quote: c.quote ?? null,
    reasoning: c.reasoning ?? null,
    confidence: c.confidence ?? null,
    importance: c.importance ?? null,
    price: (c.price ?? null) as unknown,
    weightNote: c.weightNote ?? null,
    context: (c.context ?? null) as unknown,
  }));
  await db.insert(claims).values(cleanedClaims);
  console.log(`  ✓ inserted ${cleanedClaims.length} claims`);

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
