"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { ensureUser } from "./user";
import type { Profile } from "@/lib/types";

export async function getMyProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (!row) return null;
  return {
    name: row.name ?? undefined,
    university: row.university ?? undefined,
    city: row.city ?? undefined,
    climate: (row.climate ?? undefined) as Profile["climate"],
    intake: (row.intake ?? undefined) as Profile["intake"],
    housing: (row.housing ?? undefined) as Profile["housing"],
    diet: (row.diet ?? undefined) as Profile["diet"],
    completed: row.completed,
  };
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
      climate: p.climate ?? null,
      intake: p.intake ?? null,
      housing: p.housing ?? null,
      diet: p.diet ?? null,
      completed: p.completed ?? false,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        name: sql`excluded.name`,
        university: sql`excluded.university`,
        city: sql`excluded.city`,
        climate: sql`excluded.climate`,
        intake: sql`excluded.intake`,
        housing: sql`excluded.housing`,
        diet: sql`excluded.diet`,
        completed: sql`excluded.completed`,
        updatedAt: sql`now()`,
      },
    });
}
