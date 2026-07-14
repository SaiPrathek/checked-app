"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import universities from "@/data/us-universities.json";
import universityGeo from "@/data/university-geo.json";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 30;
const UNIVERSITY_GEO = universityGeo as Record<string, { city: string; state: string }>;

interface UniversityComboboxProps {
  onSelect: (university: string) => void;
  initialValue?: string;
}

export function UniversityCombobox({ onSelect, initialValue = "" }: UniversityComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [customMode, setCustomMode] = useState(false);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return universities;

    return universities
      .filter((name) => {
        const location = UNIVERSITY_GEO[name];
        return (
          name.toLocaleLowerCase().includes(needle) ||
          `${location.city} ${location.state}`.toLocaleLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const aStarts = a.toLocaleLowerCase().startsWith(needle);
        const bStarts = b.toLocaleLowerCase().startsWith(needle);
        return Number(bStarts) - Number(aStarts) || a.localeCompare(b);
      });
  }, [query]);

  const visibleMatches = matches.slice(0, MAX_RESULTS);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function choose(name: string) {
    setQuery(name);
    setOpen(false);
    onSelect(name);
  }

  if (customMode) {
    return (
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim()) choose(query.trim());
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter your university"
          className="h-11 min-w-0 flex-1 rounded-[9px] border border-field-border bg-field px-3.5 text-[14.5px] text-ink outline-none placeholder:text-ink-muted focus-visible:border-primary"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setCustomMode(false);
              setQuery("");
            }}
            className="h-11 rounded-[9px] border border-field-border bg-field px-3.5 text-[14px] font-medium text-ink hover:bg-divider"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!query.trim()}
            className="h-11 rounded-[9px] bg-primary px-5 text-[14.5px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            Select
          </button>
        </div>
      </form>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-activedescendant={
            open && visibleMatches[activeIndex]
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) =>
                Math.min(index + 1, visibleMatches.length - 1),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open) {
              event.preventDefault();
              const selected = visibleMatches[activeIndex];
              if (selected) choose(selected);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={`Search ${universities.length.toLocaleString()} U.S. universities`}
          className="h-11 w-full rounded-[9px] border border-field-border bg-field px-3.5 pr-10 text-[14.5px] text-ink outline-none placeholder:text-ink-muted focus-visible:border-primary"
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        >
          ▼
        </span>
      </div>

      {open && (
        <div className="relative z-20 mt-1.5 w-full overflow-hidden rounded-[10px] border border-field-border bg-card shadow-[0_18px_34px_-20px_rgba(20,26,38,0.45)]">
          <ul
            id={listId}
            role="listbox"
            className="m-0 max-h-64 list-none overflow-y-auto p-1.5"
          >
            {visibleMatches.map((name, index) => {
              const location = UNIVERSITY_GEO[name];
              return (
                <li
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                key={name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(name)}
                className={cn(
                  "cursor-pointer rounded-[7px] px-3 py-2 text-[14px] leading-snug text-ink",
                  activeIndex === index && "bg-divider",
                )}
                >
                  <span className="block">{name}</span>
                  <span className="mt-0.5 block font-mono text-[10px] tracking-[0.08em] text-mono-muted">
                    {location.city}, {location.state}
                  </span>
                </li>
              );
            })}
            {visibleMatches.length === 0 && (
              <li className="px-3 py-3 text-[14px] text-ink-muted">
                No matching university found.
              </li>
            )}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-divider bg-field px-3 py-2">
            <span className="text-[12px] text-ink-muted">
              {matches.length > MAX_RESULTS
                ? `${matches.length.toLocaleString()} matches · keep typing`
                : `${matches.length.toLocaleString()} ${matches.length === 1 ? "match" : "matches"}`}
            </span>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setQuery("");
                setCustomMode(true);
                setOpen(false);
              }}
              className="shrink-0 text-[12px] font-semibold text-primary hover:underline"
            >
              Not listed?
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
