# Check-In 2.0 — Final Plan

> **Status: awaiting Sai's edits.** Mark up anything — strike lines, change options,
> reorder questions, edit copy. Then tell Claude "build from the plan" and this file
> becomes the spec. Locked decisions from review: religion is captured indirectly via
> dietary practice + cuisine (never stored directly); gender is optional + skippable.

**Design rule: never ask what you can derive, and show your work.**
Every answer must visibly make the app smarter (insight cards), and the whole
interview should stay under ~90 seconds.

---

## 1. Derivations (questions we DELETE by being smart)

| We derive | From | How |
|---|---|---|
| City + state | University | New `data/university-geo.json` — curated top ~200 universities for Indian students: `{ name, city, state, region }` |
| Climate zone (`cold / mixed / warm`) | State (+ city overrides) | New `lib/climate.ts` — static state→climate table; city-level overrides where a state spans zones (e.g. CA: SF vs LA vs Tahoe) |
| Region (Northeast / Midwest / South / West) | State | Same table |
| Winter urgency (day-one coat vs buy-later) | Climate × intake | `cold + spring` → "coat in cabin bag"; `cold + fall` → "buy there on Black Friday sales" |

**Fallback** (university not in geo file): one tap — "Which part of the US?"
(Northeast / Midwest / South / West Coast) → climate derived from region.
The current manual climate question survives *only* in this fallback.

---

## 2. The interview — 3 legs, max 11 taps

### LEG 1 · Your flight (identity & destination)

| # | Question (bot copy) | Type | Options / notes |
|---|---|---|---|
| 1 | "Hi! I'm your Check-In agent. What should I call you?" | text | — |
| 2 | "Which university are you heading to?" | combobox | existing UniversityCombobox |
| — | **INSIGHT CARD** — auto after #2 | derived | "✈ UIUC · Champaign, IL — Midwest cold zone. Winters below 0°F. Thermals matter; buy the down coat there." |
| 2b | *(fallback only)* "Which part of the US?" | choice | NE / Midwest / South / West |
| 3 | "When do you land?" | choice | Fall (Aug/Sep) / Spring (Jan) |
| — | **INSIGHT CARD** if spring+cold | derived | "You land into January. Day-one winter jacket moves to your cabin bag." |

### LEG 2 · Your setup (living situation)

| # | Question | Type | Options |
|---|---|---|---|
| 4 | "Where will you live at first?" | choice | On-campus dorm / Off-campus apartment |
| 5 | "Flying solo or with roommates?" | choice | Living alone / With roommates |
| — | **INSIGHT CARD** if roommates | derived | "Pressure cooker, tava, iron — coordinate with roommates instead of packing duplicates. I've flagged shareable items." |
| 6 | "This one's optional — it helps me tune clothing & grooming defaults." | choice | Male / Female / Non-binary / Prefer not to say *(skippable)* |

### LEG 3 · Your kitchen (food identity)

| # | Question | Type | Options |
|---|---|---|---|
| 7 | "Any dietary practice I should pack around?" | choice | Vegetarian / Jain / Halal / Eggetarian / No restrictions |
| 8 | "Which food is *home* for you?" | choice | South Indian / North Indian / West (Gujarati·Marathi) / East (Bengali·NE) |
| — | **INSIGHT CARD** after #8 | derived | e.g. South: "Sambar & rasam powders, podis, and a filter-coffee kit — ₹300 in India, $40+ imported in the US." Jain modifies: "…all onion-garlic-free." |
| 9 | "How much will you actually cook?" | choice | Almost daily / Few times a week / Rarely — mostly eat out |
| 10 | "Last one: chai or filter coffee?" | choice | Filter coffee / Chai / Both / Neither |

*Skip logic: #10 skipped if #9 = rarely AND housing = dorm.*

### Finish — Boarding-pass review card

All answers + derived fields shown as chips on a boarding-pass-styled card.
Tap any chip → re-answer just that question. Confirm → Manifest.
**Re-entering /check-in later opens this review card, not the interview.**

---

## 3. Profile schema (new shape)

```ts
interface Profile {
  name?: string;
  university?: string;
  city?: string;        // derived
  state?: string;       // derived
  region?: string;      // derived
  climate?: "cold" | "warm" | "mixed";   // derived (fallback: asked)
  intake?: "fall" | "spring";
  housing?: "dorm" | "apartment";
  roommates?: "alone" | "roommates";
  gender?: "male" | "female" | "nonbinary" | "na";   // optional
  dietPractice?: "veg" | "jain" | "halal" | "eggetarian" | "none";
  cuisine?: "south" | "north" | "west" | "east";
  cooking?: "daily" | "weekly" | "rarely";           // replaces old `diet`
  beverage?: "filter-coffee" | "chai" | "both" | "none";
  completed?: boolean;
}
```

DB: `profiles` gains `state, region, roommates, gender, diet_practice, cuisine,
cooking, beverage` columns (one `drizzle-kit push`). Old `diet` values migrate:
`veg-cooking-heavy → cooking=daily`, `eats-out → rarely`, `mixed → weekly`.

---

## 4. Manifest payoff

### 4a. New packing items (each gets a Hold entry, confidence `low`, tagged "community-pending")

| Item | Gated by | Default qty logic |
|---|---|---|
| Filter coffee kit (powder + dabara) | beverage ∈ {filter-coffee, both} | 1 |
| Chai kit (loose tea, masala) | beverage ∈ {chai, both} | 1 |
| Cuisine spice kit — South (sambar/rasam powders, podis) | cuisine=south | replaces generic "spices" default set |
| Cuisine spice kit — North (garam masala, rajma/chole) | cuisine=north | same |
| Cuisine spice kit — West (goda masala, dhokla mixes) | cuisine=west | same |
| Cuisine spice kit — East (panch phoron, mustard) | cuisine=east | same |
| Jain masala set (onion-garlic-free) | dietPractice=jain | supplements cuisine kit |
| Pickles & podis (dry, sealed) | cooking ≠ rarely | 2 |
| Trimmer / grooming kit | gender ∈ {male, nonbinary, na} | 1 — US haircuts $30-60 |
| Cosmetics & skincare starter | gender ∈ {female, nonbinary} | 1 — familiar brands for first months |
| Sanitary supply (first 2-3 months) | gender=female | 1 |
| Ethnic wear default flips | gender | saree/lehenga vs kurta/sherwani label + qty |

### 4b. Engine changes

- `qtyBy` gains dimensions: `cuisine`, `gender`, `cooking`, `roommates`, `dietPractice`, `beverage`.
  New precedence: **climate → intake → housing → roommates → dietPractice → cuisine → cooking → beverage → gender → baseQty → 1**.
- `visibleIf(profile)` predicate on PackingItem — items that don't apply
  (e.g. chai kit for beverage=none) don't render at all.
- Roommate-shareable items get a `shareable: true` flag → Manifest shows
  "🤝 coordinate with roommates" pill instead of qty stepper defaulting to 1 each.
- `resolveGuidance` reads new dimensions; Hold context maps on spices /
  instant food / kitchenware / formal wear gain cuisine & dietPractice entries.

### 4c. Manifest UI

1. **Personalization strip** (top): chips — `Champaign, IL · cold` `Jain veg`
   `South Indian` `Dorm · roommates` — each deep-links to editing that answer.
2. **"Not needed for you"** — items with recommended qty 0 collapse into a
   dimmed, collapsed section at the bottom (personalization made visible).
3. Counts in header stay as UNITS / PACKED WEIGHT (already shipped).

---

## 5. Build order (one session)

1. `data/university-geo.json` (top ~200) + `lib/climate.ts` state table
2. Profile types + DB columns + actions + old-value migration
3. Step-graph engine (`skipIf` / `deriveFrom` / legs / back-edit) + insight cards + review card
4. New packing items + qtyBy dims + visibleIf + shareable + guidance extension
5. Hold additions (new items, context entries) + reseed
6. Manifest: personalization strip + not-needed section
7. Build → smoke test → commit → push (auto-deploy)

## 6. Explicitly deferred (not in this build)

- LLM-phrased conversation (Claude rewords questions, parses free text) — slots in behind the step graph later, alongside The Tower's RAG work
- Budget sensitivity / airline & baggage-allowance question
- Program type (MS/MBA/PhD) for formal-wear tuning
- City-level climate precision beyond the override table
