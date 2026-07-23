/**
 * One-off DDL for the events table (W2 analytics). Idempotent; re-runnable.
 *   npx tsx scripts/push-events.ts
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS "events" (
      "id" text PRIMARY KEY,
      "user_id" text,
      "name" text NOT NULL,
      "meta" jsonb,
      "created_at" timestamptz DEFAULT now() NOT NULL
    );
  `;
  console.log("✓ events table ready");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
