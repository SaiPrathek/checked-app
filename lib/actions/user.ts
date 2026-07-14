"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Upsert the current Clerk user into our users table.
 * Called opportunistically before any first write; safe to call repeatedly.
 * Returns the Clerk userId, or null if signed out.
 */
export async function ensureUser(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const cu = await currentUser();
  const email = cu?.emailAddresses?.[0]?.emailAddress ?? null;

  await db
    .insert(users)
    .values({ id: userId, email })
    .onConflictDoUpdate({
      target: users.id,
      set: { email: sql`excluded.email` },
    });

  return userId;
}
