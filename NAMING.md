# Checked — naming system

**Tagline:** *Everything, checked.*

One world: **aviation / departures**. The product mirrors the arc of a flight, and the packing-weight mechanic maps onto real aviation vocabulary. Every feature, surface, and (where it fits) internal module draws its name from this world. The double meaning of the app name — *checked baggage* + *checking things off* — is the anchor.

## Canonical feature names

| Feature | Name | Why | Verticals it maps to |
|---|---|---|---|
| The app | **Checked** | checked baggage + check-off | — |
| Conversational onboarding / profile builder | **Check-In** | airport check-in = the intake conversation | conversational profiler |
| Personalized packing checklist (core output) | **The Manifest** | a cargo manifest = the itemized list you're carrying | checklist engine |
| Luggage weight visualizer / packing simulator | **Weigh-In** | drag items into bags, watch the scale | luggage lab (flagship) |
| AI Q&A assistant | **The Tower** | "ask the Tower" — air traffic control gives authoritative guidance | routed RAG |
| Knowledge base / ground-truth corpus | **The Hold** | the cargo hold where collective knowledge is stored | corpus engine |
| Post-arrival feedback loop + community stats | **Debrief** | post-flight: what worked, what didn't | rubric / flywheel |
| Pre-departure task timeline (visa, SEVIS, forex) | **Boarding Pass** | your dated sequence of steps to the gate | timeline (v2) |
| First-days-in-US arrival checklist | **Arrivals** | the arrivals hall — first 14 days on the ground | arrival guide (v2) |
| Community / social layer | **The Lounge** | the departure lounge where travelers gather | community (v2) |

## Voice & microcopy cues

Lean into the metaphor in UI copy without overdoing it:
- Empty checklist: *"Your Manifest is empty. Let's Check-In first."*
- Over weight limit in Weigh-In: *"Bag 1 is over by 2.4 kg — time to offload."*
- Asking the assistant: *"Ask the Tower anything about customs, visas, or what to pack."*
- Post-arrival prompt: *"You've landed. Ready to Debrief? Tell us what was worth packing."*
- Community stat: *"91% of flyers to cold-climate schools kept their pressure cooker. — The Lounge"*

## Naming rules for new features (keep the system coherent)

1. **Stay in the terminal.** New names come from the airport / flight world (gate, runway, carousel, layover, jet bridge, tarmac, cabin, cockpit, altitude, tailwind, standby, connection).
2. **Prefer the word travelers actually say** over insider jargon — "Arrivals," not "deplaning."
3. **One concept, one name.** Don't let two features both claim "Boarding."
4. **The name should hint at the function** to a first-time user (Weigh-In = weight; Debrief = feedback), so the metaphor aids rather than obscures.

### Reserved / on-deck vocabulary (unused, for future features)
`Carousel` (a browse/discovery feed), `Layover` (paused/saved trips), `Standby` (waitlist / notify-me), `Connection` (referrals / friends who've flown before), `Runway` (countdown widget), `Jet Bridge` (import/onboarding from another tool), `Tarmac` (admin/staging), `Black Box` (analytics/event log).
