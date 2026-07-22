"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { UniversityCombobox } from "@/components/university-combobox";
import {
  CLIMATE_LABELS,
  REGION_LABELS,
  climateForRegion,
  deriveUniversityDestination,
} from "@/lib/climate";
import {
  PROFILE_LABELS,
  hasRequiredCheckInAnswers,
  migrateProfile,
} from "@/lib/profile";
import { useApp } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { Tour, type TourStep } from "@/components/tour/tour";
import { TourButton } from "@/components/tour/tour-button";
import { useTourController } from "@/lib/tour";

const STEPS_CHECKIN: TourStep[] = [
  {
    anchor: "checkin-leg",
    title: "Four quick legs",
    body: "Your check-in is grouped into legs — your flight, your setup, your kitchen and your background. This bar tells you where you are.",
    placement: "bottom",
  },
  {
    anchor: "checkin-options",
    title: "Just tap an answer",
    body: "Pick the option that fits. Each answer sharpens what The Manifest recommends — counts, verdicts and what to skip.",
    placement: "top",
  },
  {
    anchor: "checkin-nav",
    title: "Back and forth anytime",
    body: "Move between questions freely — nothing is locked in, and you can re-answer anything later from the boarding pass.",
    placement: "top",
  },
  {
    anchor: "checkin-progress",
    title: "Under 90 seconds",
    body: "This bar fills as you go. At the end you'll get a boarding pass to review before your Manifest is built.",
    placement: "top",
  },
];

type StepKey =
  | "university"
  | "region"
  | "intake"
  | "housing"
  | "roommates"
  | "gender"
  | "dietPractice"
  | "cuisine"
  | "cooking"
  | "beverage"
  | "workExperience"
  | "wearsGlasses"
  | "license";

const TOTAL_LEGS = 4;

interface Step {
  key: StepKey;
  leg: 1 | 2 | 3 | 4;
  legLabel: string;
  prompt: string;
  type: "university" | "choice";
  options?: { value: string; label: string }[];
  visible?: (profile: Profile) => boolean;
}

const STEPS: Step[] = [
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
    prompt: "Chai or filter coffee?",
    type: "choice",
    visible: (p) => !(p.cooking === "rarely" && p.housing === "dorm"),
    options: [
      { value: "filter-coffee", label: "Filter coffee" },
      { value: "chai", label: "Chai" },
      { value: "both", label: "Both" },
      { value: "none", label: "Neither" },
    ],
  },
  {
    key: "workExperience",
    leg: 4,
    legLabel: "YOUR BACKGROUND",
    prompt: "Any work experience before this?",
    type: "choice",
    options: [
      { value: "yes", label: "Yes — I've worked" },
      { value: "no", label: "No — fresh out of college" },
    ],
  },
  {
    key: "wearsGlasses",
    leg: 4,
    legLabel: "YOUR BACKGROUND",
    prompt: "Do you wear glasses or contacts?",
    type: "choice",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "license",
    leg: 4,
    legLabel: "YOUR BACKGROUND",
    prompt: "Last one: do you have an Indian driving license?",
    type: "choice",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
];

type Mode = "loading" | "interview" | "review" | "edit";

function isAnswered(profile: Profile, key: StepKey): boolean {
  return Boolean(profile[key]);
}

function visibleSteps(profile: Profile): Step[] {
  return STEPS.filter((step) => !step.visible || step.visible(profile));
}

function firstMissingStep(profile: Profile): StepKey {
  return visibleSteps(profile).find((step) => !isAnswered(profile, step.key))?.key ?? "university";
}

export default function CheckIn() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn, user } = useUser();
  const { profile, setProfile, hydrated, serverSynced } = useApp();
  const [draft, setDraft] = useState<Profile>({});
  const [mode, setMode] = useState<Mode>("loading");
  const [stepKey, setStepKey] = useState<StepKey>("university");
  const [resetPending, setResetPending] = useState(false);
  const tour = useTourController("checkin", {
    canAutoStart: hydrated && mode === "interview",
  });

  useEffect(() => {
    if (
      !hydrated ||
      !authLoaded ||
      (isSignedIn && !serverSynced) ||
      mode !== "loading"
    ) return;
    const migrated = migrateProfile(profile);
    const accountName = user?.fullName?.trim() || user?.firstName?.trim();
    if (isSignedIn && accountName) migrated.name = accountName;
    else if (!migrated.name) migrated.name = "Traveler";
    setDraft(migrated);
    const requested = new URLSearchParams(window.location.search).get("edit") as StepKey | null;
    if (requested && STEPS.some((candidate) => candidate.key === requested)) {
      setStepKey(requested);
      setMode("edit");
    } else if (profile.completed && hasRequiredCheckInAnswers(migrated)) {
      setMode("review");
    } else {
      setStepKey(firstMissingStep(migrated));
      setMode("interview");
    }
  }, [authLoaded, hydrated, isSignedIn, mode, profile, serverSynced, user?.firstName, user?.fullName]);

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
    setMode("edit");
  }

  function goBack() {
    const previous = activeSteps[activeIndex - 1];
    if (!previous) return;
    setStepKey(previous.key);
  }

  function goNext() {
    const next = activeSteps[activeIndex + 1];
    if (mode === "edit") {
      if (next) setStepKey(next.key);
      else setMode("review");
      return;
    }
    const existingValue = draft[step.key];
    if (typeof existingValue === "string") commit(existingValue);
  }

  function resetProgress() {
    const accountName = user?.fullName?.trim() || user?.firstName?.trim();
    const fresh: Profile = {
      name: accountName || "Traveler",
      completed: false,
    };
    setDraft(fresh);
    setProfile(fresh);
    setResetPending(false);
    setStepKey("university");
    setMode("interview");
    router.replace("/check-in");
  }

  if (
    !hydrated ||
    !authLoaded ||
    (isSignedIn && !serverSynced) ||
    mode === "loading"
  ) {
    return <p className="font-mono text-xs text-mono-muted">PREPARING CHECK-IN…</p>;
  }

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="font-mono text-[11px] tracking-[0.2em] text-mono-muted">
              GATE A1 · CK 01
            </span>
            {mode !== "review" && <TourButton onClick={tour.start} />}
          </div>
          <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
            Check-In
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">
            Under 90 seconds. Every answer makes your Manifest smarter.
          </p>
        </div>
        {STEPS.some((candidate) => isAnswered(draft, candidate.key)) &&
          (resetPending ? (
            <div className="flex items-center gap-2 rounded-[9px] border border-[#e3b8aa] bg-[#fff5f1] p-1.5">
              <span className="pl-1.5 text-[12px] font-medium text-[#8b3d2f]">
                Start over?
              </span>
              <button
                type="button"
                onClick={() => setResetPending(false)}
                className="rounded-[7px] px-2.5 py-1.5 text-[12px] font-semibold text-ink-muted hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetProgress}
                className="rounded-[7px] bg-[#9d4435] px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#84392d]"
              >
                Yes, reset
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setResetPending(true)}
              className="rounded-[9px] border border-field-border bg-field px-3.5 py-2 text-[12.5px] font-semibold text-ink-muted transition-colors hover:border-primary hover:text-primary"
            >
              ↻ Reset progress
            </button>
          ))}
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
          <div className="flex items-center justify-between rounded-[10px] border border-card-border bg-[#f6f1e6] px-3.5 py-2 font-mono text-[10.5px] tracking-[0.14em] text-mono-muted" data-tour="checkin-leg">
            <span>LEG {step.leg} OF {TOTAL_LEGS}</span>
            <span>{step.legLabel}</span>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-card-border bg-card p-[22px] shadow-[0_18px_34px_-28px_rgba(20,26,38,0.5)]">
            {mode === "edit" && (
              <div className="font-mono text-[10px] tracking-[0.15em] text-primary">
                EDITING ONE ANSWER · YOU'LL RETURN TO REVIEW
              </div>
            )}

            <div className="flex flex-col gap-3" data-tour="checkin-options">
              <div>
                <div className="mb-1 font-mono text-[10px] font-bold tracking-[0.14em] text-mono-muted">
                  STEP {activeIndex + 1} OF {activeSteps.length}
                </div>
                <h2 className="m-0 font-display text-[22px] font-bold tracking-[-0.01em] text-ink">
                  {step.prompt}
                </h2>
              </div>
              {step.type === "university" ? (
                <UniversityCombobox
                  key={`${mode}-${draft.university ?? "new"}`}
                  initialValue={mode === "edit" ? draft.university : ""}
                  onSelect={commit}
                />
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

            <div className="flex items-center justify-between border-t border-divider bg-card pt-4" data-tour="checkin-nav">
              <button
                type="button"
                onClick={goBack}
                disabled={activeIndex === 0}
                className="h-10 rounded-[9px] border border-field-border bg-field px-4 text-[13.5px] font-semibold text-ink transition-colors hover:bg-divider disabled:cursor-not-allowed disabled:opacity-35"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={
                  mode === "interview" && typeof draft[step.key] !== "string"
                }
                className="h-10 rounded-[9px] bg-primary px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2" data-tour="checkin-progress">
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

      <Tour steps={STEPS_CHECKIN} open={tour.open} onClose={tour.close} />
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
          <ReviewValue label="NAME · FROM PROFILE" value={profile.name || "Traveler"} />
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
          <ReviewChip
            label="DEFAULTS · OPTIONAL"
            value={profile.gender ? PROFILE_LABELS.gender[profile.gender] : "Skipped"}
            onClick={() => onEdit("gender")}
          />
          <ReviewChip
            label="WORK EXPERIENCE"
            value={profile.workExperience ? PROFILE_LABELS.workExperience[profile.workExperience] : "Not set"}
            onClick={() => onEdit("workExperience")}
          />
          <ReviewChip
            label="EYEWEAR"
            value={profile.wearsGlasses ? PROFILE_LABELS.wearsGlasses[profile.wearsGlasses] : "Not set"}
            onClick={() => onEdit("wearsGlasses")}
          />
          <ReviewChip
            label="DRIVING LICENSE"
            value={profile.license ? PROFILE_LABELS.license[profile.license] : "Not set"}
            onClick={() => onEdit("license")}
          />
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
          className="h-11 rounded-[9px] bg-accent px-6 text-[14.5px] font-semibold text-accent-ink transition-colors hover:bg-[#e99a17]"
        >
          Confirm & see my Manifest →
        </button>
      </div>
    </section>
  );
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-card-border bg-[#f6f1e6] px-3 py-2.5 text-left">
      <span className="block font-mono text-[9px] tracking-[0.13em] text-mono-muted">
        {label}
      </span>
      <span className="mt-0.5 block text-[13.5px] font-semibold text-ink">
        {value}
      </span>
    </div>
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
