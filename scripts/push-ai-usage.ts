/**
 * One-off DDL for the ai_usage table (W1 rate-limit counter).
 * drizzle-kit push needs a TTY (strict mode); this applies the same schema
 * non-interactively and idempotently. Safe to re-run.
 *   npx tsx scripts/push-ai-usage.ts
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS "ai_usage" (
      "user_id" text NOT NULL,
      "day" text NOT NULL,
      "feature" text NOT NULL,
      "count" integer DEFAULT 0 NOT NULL,
      CONSTRAINT "ai_usage_user_id_day_feature_pk" PRIMARY KEY ("user_id", "day", "feature")
    );
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE "ai_usage"
        ADD CONSTRAINT "ai_usage_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  console.log("✓ ai_usage table ready");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
