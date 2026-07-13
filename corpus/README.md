# Corpus Engine — ground truth for the packing/relocation app

This directory is **vertical 3: the corpus engine**. It holds the proprietary packing dataset that powers the smart checklist and the routed RAG. It is designed as a two-layer, provenance-tracked, continuously-updated knowledge base — not a static list.

## Files

| File | Layer | Role |
|---|---|---|
| `sources.json` | provenance | Registry of every source with a stable id, URL, and quality tier. |
| `seed-claims.json` | evidence | One row per *(source, item)* assertion — verdict, quote, price, weight, confidence. The audit trail. |
| `seed-items.json` | **canonical** | Aggregated per-item ground truth the app serves to users. Consensus verdict + contested flag + context overrides + `communityStats`. |
| `research-report.md` | human | Cited narrative synthesis for humans (and for onboarding new contributors). |

**Why two layers.** The evidence layer (`seed-claims`) never gets overwritten — it's the citation record and lets us re-derive verdicts if we change aggregation logic. The canonical layer (`seed-items`) is a *view* over the evidence, recomputable and safe to serve. This separation is what makes the flywheel trustworthy: every user-facing verdict traces to quotes and URLs.

## The claim schema

Both layers share a vocabulary (full field docs live in each file's `_schema`):

- **category**: `documents | clothing | kitchen | food | medicines | electronics | bedding | toiletries | money`
- **verdict**: `bring-from-india | buy-in-us | either | skip`
- **context**: `{ climate, intake, diet, housing }` — arrays of conditions the verdict depends on; empty = unconditional
- **price**: `{ inr, usd, note }`
- **confidence**: `high | medium | low`
- **contested**: `true` when reputable sources disagree — the UI must show both sides

## How verdicts are computed (aggregation)

`seed-items.verdict` is derived from the supporting claims, weighted by:
1. **Source quality** — primary (university) > blog ≈ forum > secondary.
2. **Agreement** — count of claims per verdict (`support` field).
3. **Hard overrides** — a US-customs `skip` (perishables, seeds, raw rice) beats any `bring` regardless of vote count.
4. **Contested flag** — set when opposing verdicts both have credible support; verdict falls back to `either` with context-dependent guidance.

When we add real feedback, re-run aggregation to refresh `seed-items` from `seed-claims` + `communityStats`.

## The feedback flywheel (the part that compounds)

`communityStats` is `null` in v0. Post-launch it fills from two inbound streams, both normalized into the **same claim schema** so they merge cleanly with the research corpus:

1. **In-app post-arrival prompts** — 2-4 weeks after a user's arrival date, ask per packed item: *worth it / useless / should've bought there / wish I'd brought more*. Each response becomes a claim with `sourceId: user-cohort` and the user's profile as `context` (their real school, climate, intake, housing, diet).
2. **Structured surveys** — e.g. Sai's on-campus friend survey. Same schema, `sourceId: survey-<batch>`.

As claims accumulate, `communityStats` on each item gains real percentages scoped by school/climate/intake — e.g. *"91% of students at cold-climate schools said the pressure cooker was worth it."* Those stats then **outweigh** the blog/university priors in aggregation, so the dataset shifts from "what guides say" to "what students actually reported." Every stat is a shareable social-proof screenshot → organic growth.

## Known gaps to close first

- **No direct Reddit / r/f1visa data** (crawler was blocked) — the on-campus survey is the intended fix.
- **No first-hand outcome data yet** — every verdict is prescriptive (what to do), none is retrospective (what worked). The feedback loop supplies the missing half.
- **Verification incomplete** — only 2 claims passed adversarial verification before the research run hit a spend limit. Re-run verification (or hand-verify primaries) before publishing any verdict as authoritative.
- **Prices are sparse and dated** (one from 2010, one 2026). Normalize to a single reference year and currency on the next pass.

## Regenerating / extending

The dataset came from the `deep-research` workflow (run `wf_a4cb7f0c-7f3`). To extend coverage, re-run that workflow with a narrower question (e.g. "West Coast universities" or "Spring intake specifics"), extract into `seed-claims.json` with new claim ids, add any new sources to `sources.json`, then re-aggregate `seed-items.json`.
