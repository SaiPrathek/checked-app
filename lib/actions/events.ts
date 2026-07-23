"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";

/**
 * Record a product-analytics event (affiliate clicks, funnel steps). Attaches
 * the signed-in userId when present, else logs anonymously. Fire-and-forget:
 * NEVER throws — analytics must never break a user action. Callers can `void`
 * it without awaiting.
 */
export async function track(
  name: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    const clean = (name ?? "").trim().slice(0, 64);
    if (!clean) return;
    const { userId } = await auth();
    await db.insert(events).values({
      id: crypto.randomUUID(),
      userId: userId ?? null,
      name: clean,
      meta: meta ?? null,
    });
  } catch (e) {
    console.error("track", name, e);
  }
}
