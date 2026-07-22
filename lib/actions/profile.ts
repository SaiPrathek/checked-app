"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { ensureUser } from "./user";
import type { Profile } from "@/lib/types";
import { migrateProfile } from "@/lib/profile";

export async function getMyProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (!row) return null;
  return migrateProfile({
    name: row.name ?? undefined,
    university: row.university ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    region: (row.region ?? undefined) as Profile["region"],
    climate: (row.climate ?? undefined) as Profile["climate"],
    intake: (row.intake ?? undefined) as Profile["intake"],
    housing: (row.housing ?? undefined) as Profile["housing"],
    roommates: (row.roommates ?? undefined) as Profile["roommates"],
    gender: (row.gender ?? undefined) as Profile["gender"],
    dietPractice: (row.dietPractice ?? undefined) as Profile["dietPractice"],
    cuisine: (row.cuisine ?? undefined) as Profile["cuisine"],
    cooking: (row.cooking ?? undefined) as Profile["cooking"],
    beverage: (row.beverage ?? undefined) as Profile["beverage"],
    workExperience: (row.workExperience ?? undefined) as Profile["workExperience"],
    wearsGlasses: (row.wearsGlasses ?? undefined) as Profile["wearsGlasses"],
    license: (row.license ?? undefined) as Profile["license"],
    diet: row.diet ?? undefined,
    completed: row.completed,
  });
}

export async function saveProfile(p: Profile): Promise<void> {
  const userId = await ensureUser();
  if (!userId) throw new Error("Not signed in");
  await db
    .insert(profiles)
    .values({
      userId,
      name: p.name ?? null,
      university: p.university ?? null,
      city: p.city ?? null,
      state: p.state ?? null,
      region: p.region ?? null,
      climate: p.climate ?? null,
      intake: p.intake ?? null,
      housing: p.housing ?? null,
      roommates: p.roommates ?? null,
      gender: p.gender ?? null,
      dietPractice: p.dietPractice ?? null,
      cuisine: p.cuisine ?? null,
      cooking: p.cooking ?? null,
      beverage: p.beverage ?? null,
      workExperience: p.workExperience ?? null,
      wearsGlasses: p.wearsGlasses ?? null,
      license: p.license ?? null,
      completed: p.completed ?? false,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        name: sql`excluded.name`,
        university: sql`excluded.university`,
        city: sql`excluded.city`,
        state: sql`excluded.state`,
        region: sql`excluded.region`,
        climate: sql`excluded.climate`,
        intake: sql`excluded.intake`,
        housing: sql`excluded.housing`,
        roommates: sql`excluded.roommates`,
        gender: sql`excluded.gender`,
        dietPractice: sql`excluded.diet_practice`,
        cuisine: sql`excluded.cuisine`,
        cooking: sql`excluded.cooking`,
        beverage: sql`excluded.beverage`,
        workExperience: sql`excluded.work_experience`,
        wearsGlasses: sql`excluded.wears_glasses`,
        license: sql`excluded.license`,
        completed: sql`excluded.completed`,
        updatedAt: sql`now()`,
      },
    });
}
