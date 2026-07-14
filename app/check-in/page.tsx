"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UniversityCombobox } from "@/components/university-combobox";
import { useApp } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step =
  | { key: "name"; type: "text"; prompt: string; placeholder: string }
  | { key: "city"; type: "text"; prompt: string; placeholder: string }
  | { key: "university"; type: "university"; prompt: string }
  | {
      key: keyof Profile;
      type: "choice";
      prompt: string;
      options: { value: string; label: string }[];
    };

const STEPS: Step[] = [
  { key: "name", type: "text", prompt: "Hi! I'm your Check-In agent. First — what should I call you?", placeholder: "Your name" },
  { key: "university", type: "university", prompt: "Nice to meet you. Which university are you heading to?" },
  { key: "city", type: "text", prompt: "And which city will you call home?", placeholder: "e.g. Champaign, IL" },
  {
    key: "intake",
    type: "choice",
    prompt: "When do you land — which intake?",
    options: [
      { value: "fall", label: "Fall (Aug/Sep)" },
      { value: "spring", label: "Spring (Jan)" },
    ],
  },
  {
    key: "climate",
    type: "choice",
    prompt: "How cold does it get where you're going? (A rough sense is fine — I'll refine it later.)",
    options: [
      { value: "cold", label: "Cold / snowy winters" },
      { value: "warm", label: "Mostly warm" },
      { value: "mixed", label: "Mixed / not sure" },
    ],
  },
  {
    key: "housing",
    type: "choice",
    prompt: "Where will you live at first?",
    options: [
      { value: "dorm", label: "On-campus dorm" },
      { value: "apartment", label: "Off-campus apartment" },
    ],
  },
  {
    key: "diet",
    type: "choice",
    prompt: "Last one — how much will you cook?",
    options: [
      { value: "veg-cooking-heavy", label: "I'll cook a lot" },
      { value: "eats-out", label: "Mostly eat out / dining hall" },
      { value: "mixed", label: "A mix" },
    ],
  },
];

interface Turn {
  bot: string;
  answer: string;
}

export default function CheckIn() {
  const router = useRouter();
  const { profile, setProfile } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<Turn[]>([]);
  const [text, setText] = useState("");

  const step = STEPS[stepIndex];
  const done = stepIndex >= STEPS.length;
  const progressPct = Math.round((stepIndex / STEPS.length) * 100);

  function commit(value: string, label: string) {
    const s = STEPS[stepIndex];
    const next: Profile = { ...profile };
    (next as Record<string, unknown>)[s.key] = value;
    if (stepIndex + 1 >= STEPS.length) next.completed = true;
    setProfile(next);
    setHistory((h) => [...h, { bot: s.prompt, answer: label }]);
    setText("");
    setStepIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-5">
      <div>
        <div className="mb-2 font-mono text-[11px] tracking-[0.2em] text-mono-muted">
          GATE A1 · CK 01
        </div>
        <h1 className="m-0 font-display text-[34px] font-bold tracking-[-0.02em]">
          Check-In
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          A two-minute conversation so The Manifest is tailored to you.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-card-border bg-card p-[22px] shadow-[0_18px_34px_-28px_rgba(20,26,38,0.5)]">
        {history.map((t, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bubble side="bot">{t.bot}</Bubble>
            <Bubble side="user">{t.answer}</Bubble>
          </div>
        ))}

        {!done && step && (
          <div className="flex flex-col gap-3">
            <Bubble side="bot">{step.prompt}</Bubble>
            {step.type === "university" ? (
              <UniversityCombobox
                onSelect={(university) => commit(university, university)}
              />
            ) : step.type === "text" ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) commit(text.trim(), text.trim());
                }}
              >
                <input
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={step.placeholder}
                  className="h-11 flex-1 rounded-[9px] border border-field-border bg-field px-3.5 text-[14.5px] text-ink outline-none focus-visible:border-primary"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="h-11 rounded-[9px] bg-primary px-5 text-[14.5px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2">
                {step.options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => commit(o.value, o.label)}
                    className="h-[42px] rounded-[9px] border border-field-border bg-field px-4 text-[14px] font-medium text-ink transition-colors hover:bg-divider"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {done && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="max-w-[90%] rounded-2xl bg-[#f1ece0] px-4 py-3.5 text-[14.5px] leading-[1.5]">
              All set{profile.name ? `, ${profile.name}` : ""}! I've tailored
              your Manifest — winter gear, kitchen kit and food verdicts now
              reflect your intake, climate, housing and cooking.
            </div>
            <button
              onClick={() => router.push("/manifest")}
              className="h-12 rounded-[9px] bg-accent px-6 text-[15px] font-semibold text-accent-ink"
            >
              See my Manifest →
            </button>
          </div>
        )}
      </div>

      {!done && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between font-mono text-[10.5px] tracking-[0.16em] text-mono-muted">
            <span>BOARDING PROGRESS</span>
            <span>
              STEP {stepIndex + 1} / {STEPS.length}
            </span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-[4px] bg-[#e0d6c2]">
            <div
              className="h-full rounded-[4px] bg-accent transition-[width]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({
  side,
  children,
}: {
  side: "bot" | "user";
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex", side === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3.5 py-2.5 text-[14.5px] leading-[1.45]",
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
