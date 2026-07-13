import { type Verdict } from "@/lib/types";

/** Verdict pill — explicit color triples ported from the airport design. */
const V: Record<Verdict, { label: string; fg: string; bg: string; bd: string }> = {
  "bring-from-india": { label: "Bring from India", fg: "#147A48", bg: "#E7F4EC", bd: "#B7E0C6" },
  "buy-in-us": { label: "Buy in the US", fg: "#1257B8", bg: "#E7F0FB", bd: "#BDD6F5" },
  either: { label: "Either / your call", fg: "#9A5B00", bg: "#FBF1DC", bd: "#F0DBAE" },
  skip: { label: "Skip", fg: "#B23127", bg: "#FBE8E5", bd: "#F2C9C2" },
};

export function VerdictBadge({
  verdict,
  contested,
}: {
  verdict: Verdict;
  contested?: boolean;
}) {
  const v = V[verdict];
  return (
    <span
      className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ color: v.fg, background: v.bg, borderColor: v.bd }}
    >
      {v.label}
      {contested && (
        <span
          className="font-mono text-[9px] opacity-75"
          title="Sources disagree — see details"
        >
          •CONTESTED
        </span>
      )}
    </span>
  );
}
