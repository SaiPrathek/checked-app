"use client";

/**
 * Compact − N + stepper used on Manifest rows.
 * value=0 is meaningful — it removes the item from the list.
 */
export function QtyStepper({
  value,
  onChange,
  max = 99,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  label?: string;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(max, Math.floor(n)));
  return (
    <div
      className="inline-flex items-center rounded-[8px] border border-field-border bg-field font-mono text-[12.5px]"
      role="group"
      aria-label={label ?? "Quantity"}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 0}
        className="h-7 w-7 rounded-l-[7px] text-ink-muted transition-colors hover:bg-divider disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isNaN(n) ? 0 : clamp(n));
        }}
        onFocus={(e) => e.currentTarget.select()}
        className="h-7 w-9 border-x border-field-border bg-transparent text-center text-ink outline-none focus-visible:border-primary"
        aria-label={label ?? "Quantity"}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className="h-7 w-7 rounded-r-[7px] text-ink-muted transition-colors hover:bg-divider disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
