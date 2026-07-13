import { cn } from "@/lib/utils";

/** Weight fill meter for Weigh-In. Green good · amber near · red over. */
export function Meter({
  value,
  limit,
  className,
}: {
  value: number;
  limit: number;
  className?: string;
}) {
  const pct = Math.min(100, (value / limit) * 100);
  const over = value > limit;
  const near = !over && value > limit * 0.9;
  const color = over ? "var(--over)" : near ? "var(--near)" : "var(--good)";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-[5px] bg-card-border", className)}>
      <div
        className="h-full rounded-[5px] transition-[width] duration-200"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
