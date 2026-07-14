import { DEBRIEF_LABEL, type Stat } from "@/lib/debrief";

/**
 * Compact community-consensus pill shown next to each Manifest item.
 * Renders nothing when the stat is below the response threshold (already
 * filtered out server-side by getCommunityStats).
 */
export function CommunityStat({ stat }: { stat: Stat | undefined }) {
  if (!stat || !stat.top) return null;
  const label = DEBRIEF_LABEL[stat.top.verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-[#f6f1e6] px-2 py-0.5 text-[10.5px] font-medium text-ink-muted"
      title={`${stat.total} student debriefs · click for the breakdown`}
    >
      <span className="font-mono font-bold text-ink">{stat.top.pct}%</span>
      <span>{label.toLowerCase()}</span>
      <span className="font-mono text-[9.5px] text-mono-muted">
        · {stat.total}
      </span>
    </span>
  );
}
