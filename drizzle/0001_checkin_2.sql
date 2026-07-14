-- Check-In 2.0 additive profile fields and Hold metadata.
-- Review against the target environment before applying.
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "state" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "region" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "roommates" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "diet_practice" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "cuisine" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "cooking" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "beverage" text;
ALTER TABLE "hold_items" ADD COLUMN IF NOT EXISTS "tags" jsonb;

-- Preserve the old answer while moving it into the new cooking-frequency shape.
UPDATE "profiles"
SET "cooking" = CASE "diet"
  WHEN 'veg-cooking-heavy' THEN 'daily'
  WHEN 'eats-out' THEN 'rarely'
  WHEN 'mixed' THEN 'weekly'
  ELSE "cooking"
END
WHERE "cooking" IS NULL AND "diet" IS NOT NULL;
