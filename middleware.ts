import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk is available on every request so <SignedIn>/<SignedOut>/useUser() work,
 * but no route is force-protected. Anonymous users can use the whole app
 * (state persisted to localStorage) and sign-in only unlocks cross-device sync
 * and the Debrief flywheel. Server actions themselves are the real auth gate:
 * anything that writes to the DB requires a Clerk userId.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // skip Next internals and static assets, run everywhere else
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
