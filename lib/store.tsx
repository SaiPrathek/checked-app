"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { BagId, Profile } from "./types";

interface AppState {
  profile: Profile;
  /** ids of PackingItems the user has added to their Manifest */
  list: string[];
  /** which bag each listed item is assigned to in Weigh-In */
  bags: Record<string, BagId | undefined>;
  hydrated: boolean;

  setProfile: (p: Profile) => void;
  toggleListItem: (id: string) => void;
  isListed: (id: string) => boolean;
  assignBag: (id: string, bag: BagId | undefined) => void;
  reset: () => void;
}

const STORAGE_KEY = "checked.v0";
const AppContext = createContext<AppState | null>(null);

interface Persisted {
  profile: Profile;
  list: string[];
  bags: Record<string, BagId | undefined>;
}

function load(): Persisted {
  if (typeof window === "undefined") return { profile: {}, list: [], bags: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { profile: {}, list: [], bags: {}, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { profile: {}, list: [], bags: {} };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>({});
  const [list, setList] = useState<string[]>([]);
  const [bags, setBags] = useState<Record<string, BagId | undefined>>({});
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    const p = load();
    setProfileState(p.profile);
    setList(p.list);
    setBags(p.bags);
    setHydrated(true);
  }, []);

  // persist on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, list, bags }),
      );
    } catch {
      /* ignore */
    }
  }, [profile, list, bags, hydrated]);

  const value: AppState = {
    profile,
    list,
    bags,
    hydrated,
    setProfile: setProfileState,
    toggleListItem: (id) =>
      setList((cur) =>
        cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
      ),
    isListed: (id) => list.includes(id),
    assignBag: (id, bag) => setBags((cur) => ({ ...cur, [id]: bag })),
    reset: () => {
      setProfileState({});
      setList([]);
      setBags({});
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
