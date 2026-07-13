# Checked

*Everything, checked.* A relocation copilot for Indian students moving to the US — personalized packing verdicts, a live luggage weigher, and community-backed guidance.

## Run it

You'll need **Node.js 18.18+** (Node 20+ recommended). This machine didn't have Node installed when the scaffold was generated, so it has **not been built/verified yet** — install Node, then:

```bash
cd checked
npm install
npm run dev      # http://localhost:3000
```

`npm run build` to production-build, `npm start` to serve it.

## Deploy to Vercel

The repo is committed and ready. v0 needs no environment variables (state is localStorage-only), so deploy is just:

1. **Push to GitHub.** Create a new empty repo (e.g. `checked`) on github.com, then:
   ```bash
   git remote add origin git@github.com:<you>/checked.git   # or the https URL
   git push -u origin main
   ```
2. **Import to Vercel.** At vercel.com → *Add New → Project* → import the `checked` repo. Vercel auto-detects Next.js; keep the defaults (build `next build`, output handled automatically) and click **Deploy**. Node is pinned to 22.x via `package.json` engines / `.nvmrc`.
3. You get a live `*.vercel.app` URL. Every future `git push` to `main` auto-deploys.

No secrets to set yet — add them under *Project → Settings → Environment Variables* when Phase 2+ lands (see `.env.example`).

## What's here (v0)

A working first draft with **basic, intentionally re-skinnable design**. The four verticals from the plan, named per the aviation system in [NAMING.md](NAMING.md):

| Route | Name | What it does |
|---|---|---|
| `/` | Landing | Hero + feature cards |
| `/check-in` | **Check-In** | Conversational onboarding → builds your profile |
| `/manifest` | **The Manifest** | Packing checklist with per-item verdicts from The Hold, personalized by your profile |
| `/weigh-in` | **Weigh-In** | Drag items into bags, live weight meters vs 23 kg / 7 kg limits |
| `/the-tower` | **The Tower** | Ask-a-question UI with local retrieval over The Hold (Claude API plugs in later) |

State (profile, list, bag assignments) persists to `localStorage` — no backend yet.

## Architecture

```
app/            route segments (one folder per vertical) + globals.css (design tokens)
components/
  ui/           primitives: button, card, verdict-badge, meter  ← re-skin surface
  nav.tsx
lib/
  types.ts      Category, Verdict, HoldItem, PackingItem, Profile, BAGS
  hold.ts       loads The Hold (data/hold.json)
  packing-items.ts  concrete packable items (weights) → linked to Hold verdicts
  guidance.ts   resolveGuidance(hold, profile) + searchHold() for The Tower
  store.tsx     client state + localStorage (AppProvider / useApp)
data/hold.json  copy of ../corpus/seed-items.json (the ground-truth verdicts)
```

**Data flow:** `corpus/seed-items.json` (The Hold) → `data/hold.json` → verdicts shown in The Manifest & The Tower. `packing-items.ts` provides concrete items with weights and links each back to a Hold verdict via `holdKey`. When the corpus is regenerated, re-copy it: `cp corpus/seed-items.json data/hold.json`.

## Design — airport / boarding-pass theme (applied)

The visual design from `Airport-themed app design/Checked.dc.html` (the design-agent output) has been ported into the app: warm-paper surfaces, a dark "departures board" header + live status ticker, Space Grotesk / Hanken Grotesk / JetBrains Mono type, verdict pills, a flight-strip landing board, and boarding-pass feature cards.

It's token-driven so further tweaks don't mean rewriting screens:

1. **Colors, radius** live as CSS variables in [`app/globals.css`](app/globals.css) under `:root` (paper/ink/card/nav chrome/accent + `--good/near/over` meters). Change those first; Tailwind reads them via `tailwind.config.ts`. Don't hardcode hex in components — a few one-off dark shades use Tailwind arbitrary values (`bg-[#0d1626]`) and can be promoted to tokens if reused.
2. **Fonts** are wired via `next/font/google` in [`app/layout.tsx`](app/layout.tsx) → `--font-display` (Space Grotesk), `--font-sans` (Hanken Grotesk), `--font-mono` (JetBrains Mono).
3. **Verdict colors** (the four bring/buy/either/skip triples) live in [`components/ui/verdict-badge.tsx`](components/ui/verdict-badge.tsx).
4. **Primitives** in [`components/ui/`](components/ui) — `button.tsx`, `card.tsx`, `verdict-badge.tsx`, `meter.tsx`. Restyle these and every screen updates.
5. **Screens** (`app/**/page.tsx`) compose the primitives; the signature motifs (flight board, boarding-pass cards, status ticker, `GATE x · CK 0n` eyebrows) live there.

The original design mockup is preserved in `Airport-themed app design/` for reference. Keep the aviation naming system (NAMING.md) intact when adding UI copy.

## Not built yet (roadmap)

- Auth + real backend/DB (Neon Postgres + Drizzle) — currently localStorage only
- **Debrief** feedback loop + community stats (the flywheel; see corpus/README.md)
- The Tower's routed-RAG + Claude API layer (UI is ready; swap `searchHold` for an API route)
- **Duty-Free** affiliate links on `buy-in-us` items (data hooks planned, see NAMING.md)
- Boarding Pass (pre-departure timeline) and Arrivals (first-14-days) verticals
- Real drag-and-drop polish, PWA/offline, tests
