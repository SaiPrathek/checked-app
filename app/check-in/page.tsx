"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UniversityCombobox } from "@/components/university-combobox";
import {
  CLIMATE_LABELS,
  REGION_LABELS,
  climateForRegion,
  deriveUniversityDestination,
  destinationInsight,
} from "@/lib/climate";
import {
  PROFILE_LABELS,
  hasRequiredCheckInAnswers,
  migrateProfile,
} from "@/lib/profile";
import { useApp } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type StepKey =
  | "name"
  | "university"
  | "region"
  | "intake"
  | "housing"
  | "roommates"
  | "gender"
  | "dietPractice"
  | "cuisine"
  | "cooking"
  | "beverage";

interface Step {
  key: StepKey;
  leg: 1 | 2 | 3;
  legLabel: string;
  prompt: string;
  type: "text" | "university" | "choice";
  placeholder?: string;
  options?: { value: string; label: string }[];
  visible?: (profile: Profile) => boolean;
}

const STEPS: Step[] = [
  {
    key: "name",
    leg: 1,
    legLabel: "YOUR FLIGHT",
    prompt: "Hi! I'm your Check-In agent. What should I call you?",
    type: "text",
    placeholder: "Your name",
  },
  {
    key: "university",
    leg: 1,
    legLabel: "YOUR FLIGHT",
    prompt: "Which university are you heading to?",
    type: "university",
  },
  {
    key: "region",
    leg: 1,
    legLabel: "YOUR FLIGHT",
    prompt: "Which part of the US?",
    type: "choice",
    visible: (p) => Boolean(p.university && !p.city),
    options: [
      { value: "northeast", label: "Northeast" },
      { value: "midwest", label: "Midwest" },
      { value: "south", label: "South" },
      { value: "west", label: "West Coast" },
    ],
  },
  {
    key: "intake",
    leg: 1,
    legLabel: "YOUR FLIGHT",
    prompt: "When do you land?",
    type: "choice",
    options: [
      { value: "fall", label: "Fall (Aug/Sep)" },
      { value: "spring", label: "Spring (Jan)" },
    ],
  },
  {
    key: "housing",
    leg: 2,
    legLabel: "YOUR SETUP",
    prompt: "Where will you live at first?",
    type: "choice",
    options: [
      { value: "dorm", label: "On-campus dorm" },
      { value: "apartment", label: "Off-campus apartment" },
    ],
  },
  {
    key: "roommates",
    leg: 2,
    legLabel: "YOUR SETUP",
    prompt: "Flying solo or with roommates?",
    type: "choice",
    options: [
      { value: "alone", label: "Living alone" },
      { value: "roommates", label: "With roommates" },
    ],
  },
  {
    key: "gender",
    leg: 2,
    legLabel: "YOUR SETUP",
    prompt: "This one's optional — it helps me tune clothing & grooming defaults.",
    type: "choice",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "nonbinary", label: "Non-binary" },
      { value: "na", label: "Prefer not to say" },
    ],
  },
  {
    key: "dietPractice",
    leg: 3,
    legLabel: "YOUR KITCHEN",
    prompt: "Any dietary practice I should pack around?",
    type: "choice",
    options: [
      { value: "veg", label: "Vegetarian" },
      { value: "jain", label: "Jain" },
      { value: "halal", label: "Halal" },
      { value: "eggetarian", label: "Eggetarian" },
      { value: "none", label: "No restrictions" },
    ],
  },
  {
    key: "cuisine",
    leg: 3,
    legLabel: "YOUR KITCHEN",
    prompt: "Which food is home for you?",
    type: "choice",
    options: [
      { value: "south", label: "South Indian" },
      { value: "north", label: "North Indian" },
      { value: "west", label: "West · Gujarati / Marathi" },
      { value: "east", label: "East · Bengali / Northeast" },
    ],
  },
  {
    key: "cooking",
    leg: 3,
    legLabel: "YOUR KITCHEN",
    prompt: "How much will you actually cook?",
    type: "choice",
    options: [
      { value: "daily", label: "Almost daily" },
      { value: "weekly", label: "A few times a week" },
      { value: "rarely", label: "Rarely — mostly eat out" },
    ],
  },
  {
    key: "beverage",
    leg: 3,
    legLabel: "YOUR KITCHEN",
    prompt: "Last one: chai or filter coffee?",
    type: "choice",
    visible: (p) => !(p.cooking === "rarely" && p.housing === "dorm"),
    options: [
      { value: "filter-coffee", label: "Filter coffee" },
      { value: "chai", label: "Chai" },
      { value: "both", label: "Both" },
      { value: "none", label: "Neither" },
    ],
  },
];

interface Turn {
  key: StepKey;
  bot: string;
  answer: string;
  insight?: string | null;
}

type Mode = "loading" | "interview" | "review" | "edit";

function isAnswered(profile: Profile, key: StepKey): boolean {
  return Boolean(profile[key]);
}

function visibleSteps(profile: Profile): Step[] {
  return STEPS.filter((step) => !step.visible || step.visible(profile));
}

function firstMissingStep(profile: Profile): StepKey {
  return visibleSteps(profile).find((step) => !isAnswered(profile, step.key))?.key ?? "name";
}

function answerLabel(step: Step, value: string): string {
  return step.options?.find((option) => option.value === value)?.label ?? value;
}

function insightFor(key: StepKey, profile: Profile): string | null {
  if (key === "university" || key === "region") {
    const exact = destinationInsight(profile);
    if (exact) return exact;
    if (key === "region" && profile.region && profile.climate) {
      return `✈ ${REGION_LABELS[profile.region]} selected. I'm using a ${CLIMATE_LABELS[profile.climate]} packing baseline until we know the exact city.`;
    }
    return null;
  }
  if (key === "intake" && profile.intake === "spring" && profile.climate === "cold") {
    return "You land into January. Your day-one winter jacket moves to the cabin bag.";
  }
  if (key === "roommates" && profile.roommates === "roommates") {
    return "Pressure cooker, tava and iron — coordinate instead of packing duplicates. I've flagged shareable items.";
  }
  if (key === "cuisine" && profile.cuisine) {
    const cuisineCopy = {
      south: "Sambar & rasam powders, podis and a filter-coffee kit",
      north: "Garam masala, rajma and chole essentials",
      west: "Goda masala, dhokla mixes and familiar pickles",
      east: "Panch phoron, mustard and hard-to-find regional staples",
    }[profile.cuisine];
    const modifier = profile.dietPractice === "jain" ? " — all onion-garlic-free" : "";
    return `${cuisineCopy}${modifier}. Familiar ₹300 staples can cost $40+ imported in the US.`;
  }
  return null;
}

export default function CheckIn() {
  const router = useRouter();
  const { profile, setProfile, hydrated } = useApp();
  const [draft, setDraft] = useState<Profile>({});
  const [mode, setMode] = useState<Mode>("loading");
  const [stepKey, setStepKey] = useState<StepKey>("name");
  const [history, setHistory] = useState<Turn[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!hydrated || mode !== "loading") return;
    const migrated = migrateProfile(profile);
    setDraft(migrated);
    if (profile.completed && hasRequiredCheckInAnswers(migrated)) {
      const requested = new URLSearchParams(window.location.search).get("edit") as StepKey | null;
      if (requested && STEPS.some((candidate) => candidate.key === requested)) {
        setStepKey(requested);
        setText(requested === "name" ? migrated.name ?? "" : "");
        setMode("edit");
      } else {
        setMode("review");
      }
    } else {
      setStepKey(firstMissingStep(migrated));
      setMode("interview");
    }
  }, [hydrated, mode, profile]);

  const step = STEPS.find((candidate) => candidate.key === stepKey) ?? STEPS[0];
  const activeSteps = useMemo(() => visibleSteps(draft), [draft]);
  const activeIndex = Math.max(0, activeSteps.findIndex((candidate) => candidate.key === stepKey));
  const progressPct = Math.round((activeIndex / activeSteps.length) * 100);

  function commit(value: string) {
    const current = step;
    const next: Profile = { ...draft };

    if (current.key === "university") {
      next.university = value;
      const destination = deriveUniversityDestination(value);
      if (destination) {
        Object.assign(next, destination);
      } else {
        delete next.city;
        delete next.state;
        delete next.region;
        delete next.climate;
      }
    } else if (current.key === "region") {
      next.region = value as NonNullable<Profile["region"]>;
      next.climate = climateForRegion(next.region);
    } else {
      (next as Record<string, unknown>)[current.key] = value;
    }

    if (next.cooking === "rarely" && next.housing === "dorm") {
      delete next.beverage;
    }

    setDraft(next);
    setText("");

    if (mode === "edit") {
      if (current.key === "university" && !next.city) {
        setProfile({ ...next, completed: false });
        setStepKey("region");
        return;
      }
      const completed = hasRequiredCheckInAnswers(next);
      const saved = { ...next, completed };
      setDraft(saved);
      setProfile(saved);
      setMode("review");
      return;
    }

    setHistory((turns) => [
      ...turns,
      {
        key: current.key,
        bot: current.prompt,
        answer: answerLabel(current, value),
        insight: insightFor(current.key, next),
      },
    ]);

    const candidates = visibleSteps(next);
    const currentIndex = STEPS.findIndex((candidate) => candidate.key === current.key);
    const nextStep = candidates.find(
      (candidate) =>
        STEPS.findIndex((item) => item.key === candidate.key) > currentIndex &&
        !isAnswered(next, candidate.key),
    );

    if (nextStep) {
      setProfile({ ...next, completed: false });
      setStepKey(nextStep.key);
    } else {
      const completed = { ...next, completed: true };
      setDraft(completed);
      setProfile(completed);
      setMode("review");
    }
  }

  function edit(key: StepKey) {
    setStepKey(key);
    setText(key === "name" ? draft.name ?? "" : "");
    setMode("edit");
  }

  if (!hydrated || mode === "loading") {
    return <p className="font-mono text-xs text-mono-muted">PREPARING CHECK-IN…</p>;
  }

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <header>
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          GATE A1 · CK 01
        </div>
        <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
          Check-In
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          Under 90 seconds. Every answer makes your Manifest smarter.
        </p>
      </header>

      {mode === "review" ? (
        <BoardingPass
          profile={draft}
          onEdit={edit}
          onConfirm={() => {
            const completed = { ...draft, completed: true };
            setProfile(completed);
            router.push("/manifest");
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between rounded-[10px] border border-card-border bg-[#f6f1e6] px-3.5 py-2 font-mono text-[10.5px] tracking-[0.14em] text-mono-muted">
            <span>LEG {step.leg} OF 3</span>
            <span>{step.legLabel}</span>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-card-border bg-card p-[22px] shadow-[0_18px_34px_-28px_rgba(20,26,38,0.5)]">
            {mode === "interview" &&
              history.map((turn, index) => (
                <div key={`${turn.key}-${index}`} className="flex flex-col gap-2">
                  <Bubble side="bot">{turn.bot}</Bubble>
                  <Bubble side="user">{turn.answer}</Bubble>
                  {turn.insight && <InsightCard>{turn.insight}</InsightCard>}
                </div>
              ))}

            {mode === "edit" && (
              <div className="font-mono text-[10px] tracking-[0.15em] text-primary">
                EDITING ONE ANSWER · YOU'LL RETURN TO REVIEW
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Bubble side="bot">{step.prompt}</Bubble>
              {step.type === "university" ? (
                <UniversityCombobox
                  key={`${mode}-${draft.university ?? "new"}`}
                  initialValue={mode === "edit" ? draft.university : ""}
                  onSelect={commit}
                />
              ) : step.type === "text" ? (
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (text.trim()) commit(text.trim());
                  }}
                >
                  <input
                    autoFocus
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={step.placeholder}
                    className="h-11 min-w-0 flex-1 rounded-[9px] border border-field-border bg-field px-3.5 text-[14.5px] text-ink outline-none focus-visible:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="h-11 rounded-[9px] bg-primary px-5 text-[14.5px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {step.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => commit(option.value)}
                      className="min-h-[42px] rounded-[9px] border border-field-border bg-field px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:border-primary hover:bg-divider"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-mono text-[10.5px] tracking-[0.16em] text-mono-muted">
              <span>BOARDING PROGRESS</span>
              <span>
                STEP {activeIndex + 1} / {activeSteps.length}
              </span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-[4px] bg-[#e0d6c2]">
              <div
                className="h-full rounded-[4px] bg-accent transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BoardingPass({
  profile,
  onEdit,
  onConfirm,
}: {
  profile: Profile;
  onEdit: (key: StepKey) => void;
  onConfirm: () => void;
}) {
  const location = profile.city && profile.state
    ? `${profile.city}, ${profile.state}`
    : profile.region
      ? REGION_LABELS[profile.region]
      : "Add destination";
  const beverageSkipped = profile.cooking === "rarely" && profile.housing === "dorm";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#22344f] bg-card shadow-[0_20px_38px_-28px_rgba(6,12,24,0.65)]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-nav px-5 py-4 text-nav-text">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-nav-muted">
            BOARDING PASS · PROFILE REVIEW
          </div>
          <h2 className="mt-1 font-display text-[22px] font-bold">
            Ready for departure, {profile.name || "traveler"}?
          </h2>
        </div>
        <div className="rounded-full border border-nav-border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-accent">
          CK 01 · CLEARED
        </div>
      </div>

      <div className="relative grid gap-5 p-5 sm:grid-cols-3">
        <div className="pointer-events-none absolute bottom-0 left-[33.333%] top-0 hidden border-l border-dashed border-card-border sm:block" />
        <div className="flex flex-col gap-2">
          <ReviewChip label="NAME" value={profile.name} onClick={() => onEdit("name")} />
          <ReviewChip label="UNIVERSITY" value={profile.university} onClick={() => onEdit("university")} />
          <ReviewChip
            label="DESTINATION · DERIVED"
            value={`${location}${profile.climate ? ` · ${CLIMATE_LABELS[profile.climate]}` : ""}`}
            onClick={() => onEdit(profile.city ? "university" : "region")}
          />
          <ReviewChip label="ARRIVAL" value={profile.intake && PROFILE_LABELS.intake[profile.intake]} onClick={() => onEdit("intake")} />
        </div>
        <div className="flex flex-col gap-2 sm:pl-5">
          <ReviewChip label="HOUSING" value={profile.housing && PROFILE_LABELS.housing[profile.housing]} onClick={() => onEdit("housing")} />
          <ReviewChip label="HOUSEHOLD" value={profile.roommates && PROFILE_LABELS.roommates[profile.roommates]} onClick={() => onEdit("roommates")} />
          <ReviewChip label="DEFAULTS" value={profile.gender && PROFILE_LABELS.gender[profile.gender]} onClick={() => onEdit("gender")} />
        </div>
        <div className="flex flex-col gap-2">
          <ReviewChip label="DIET" value={profile.dietPractice && PROFILE_LABELS.dietPractice[profile.dietPractice]} onClick={() => onEdit("dietPractice")} />
          <ReviewChip label="HOME FOOD" value={profile.cuisine && PROFILE_LABELS.cuisine[profile.cuisine]} onClick={() => onEdit("cuisine")} />
          <ReviewChip label="COOKING" value={profile.cooking && PROFILE_LABELS.cooking[profile.cooking]} onClick={() => onEdit("cooking")} />
          <ReviewChip
            label="CUP"
            value={profile.beverage ? PROFILE_LABELS.beverage[profile.beverage] : beverageSkipped ? "Skipped for dorm setup" : undefined}
            onClick={() => onEdit("beverage")}
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-dashed border-card-border bg-[#f6f1e6] px-5 py-4 sm:flex-row">
        <p className="m-0 text-[13px] text-ink-muted">Tap any field to re-answer just that question.</p>
        <button
          onClick={onConfirm}
          disabled={!hasRequiredCheckInAnswers(profile)}
          className="h-11 rounded-[9px] bg-accent px-6 text-[14.5px] font-semibold text-accent-ink disabled:opacity-50"
        >
          Confirm & see my Manifest →
        </button>
      </div>
    </section>
  );
}

function ReviewChip({
  label,
  value,
  onClick,
}: {
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-[9px] border border-card-border bg-field px-3 py-2.5 text-left transition-colors hover:border-primary"
    >
      <span className="block font-mono text-[9px] tracking-[0.13em] text-mono-muted">
        {label}
      </span>
      <span className="mt-0.5 block text-[13.5px] font-semibold text-ink group-hover:text-primary">
        {value || "Add answer"} <span className="font-normal opacity-50">↗</span>
      </span>
    </button>
  );
}

function InsightCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-0 rounded-[12px] border border-[#f0d49a] bg-[#fff8e8] px-4 py-3 text-[13.5px] leading-[1.5] text-[#5d430f] sm:ml-6">
      <div className="mb-1 font-mono text-[9.5px] font-bold tracking-[0.15em] text-[#9a6500]">
        MANIFEST UPDATED
      </div>
      {children}
    </div>
  );
}

function Bubble({ side, children }: { side: "bot" | "user"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", side === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] px-3.5 py-2.5 text-[14.5px] leading-[1.45]",
          side === "user"
            ? "rounded-[16px_16px_4px_16px] bg-primary text-white"
            : "rounded-[16px_16px_16px_4px] bg-[#f1ece0] text-ink",
        )}
      >
        {children}
      </div>
    </div>
  );
}
