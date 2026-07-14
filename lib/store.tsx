"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import type { BagId, Profile } from "./types";
import { getMyProfile, saveProfile } from "./actions/profile";
import {
  getMyList,
  toggleListItem as serverToggle,
  assignBag as serverAssign,
  importList,
} from "./actions/list";

interface AppState {
  profile: Profile;
  /** ids of PackingItems the user has added to their Manifest */
  list: string[];
  /** which bag each listed item is assigned to in Weigh-In */
  bags: Record<string, BagId | undefined>;
  hydrated: boolean;
  /** true when we've loaded state from the server (signed-in users only) */
  serverSynced: boolean;

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

function loadLocal(): Persisted {
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
  const { isLoaded, isSignedIn, user } = useUser();
  const [profile, setProfileState] = useState<Profile>({});
  const [list, setList] = useState<string[]>([]);
  const [bags, setBags] = useState<Record<string, BagId | undefined>>({});
  const [hydrated, setHydrated] = useState(false);
  const [serverSynced, setServerSynced] = useState(false);

  // Guard: run the server-hydration once per signed-in user so re-renders don't re-fetch.
  const hydratedForUser = useRef<string | null>(null);

  // 1) initial hydrate from localStorage (works for signed-out AND is the offline fallback)
  useEffect(() => {
    const p = loadLocal();
    setProfileState(p.profile);
    setList(p.list);
    setBags(p.bags);
    setHydrated(true);
  }, []);

  // 2) when signed in, pull server state (and one-shot migrate localStorage if server is empty)
  useEffect(() => {
    if (!hydrated || !isLoaded) return;
    if (!isSignedIn || !user) {
      setServerSynced(false);
      hydratedForUser.current = null;
      return;
    }
    if (hydratedForUser.current === user.id) return;
    hydratedForUser.current = user.id;

    (async () => {
      const [serverProfile, serverList] = await Promise.all([
        getMyProfile(),
        getMyList(),
      ]);

      const local = loadLocal();
      const serverIsEmpty = !serverProfile && serverList.length === 0;
      const localHasSomething =
        Object.keys(local.profile ?? {}).length > 0 || local.list.length > 0;

      if (serverIsEmpty && localHasSomething) {
        // Migrate anonymous localStorage state to the server on first sign-in
        if (Object.keys(local.profile).length > 0) {
          await saveProfile(local.profile);
          setProfileState(local.profile);
        }
        if (local.list.length > 0) {
          await importList(
            local.list.map((id) => ({ itemId: id, bag: local.bags[id] ?? null })),
          );
          setList(local.list);
          setBags(local.bags);
        }
      } else {
        if (serverProfile) setProfileState(serverProfile);
        if (serverList.length) {
          setList(serverList.map((r) => r.itemId));
          const b: Record<string, BagId | undefined> = {};
          for (const r of serverList) if (r.bag) b[r.itemId] = r.bag;
          setBags(b);
        }
      }
      setServerSynced(true);
    })().catch((e) => console.error("[Checked] server sync failed", e));
  }, [hydrated, isLoaded, isSignedIn, user]);

  // 3) persist to localStorage whenever state changes (used as offline cache too)
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

  const setProfile = useCallback(
    (p: Profile) => {
      setProfileState(p);
      if (isSignedIn) saveProfile(p).catch((e) => console.error("saveProfile", e));
    },
    [isSignedIn],
  );

  const toggleListItem = useCallback(
    (id: string) => {
      setList((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
      if (isSignedIn) serverToggle(id).catch((e) => console.error("toggleListItem", e));
    },
    [isSignedIn],
  );

  const assignBag = useCallback(
    (id: string, bag: BagId | undefined) => {
      setBags((cur) => ({ ...cur, [id]: bag }));
      if (isSignedIn)
        serverAssign(id, (bag ?? null) as BagId | null).catch((e) =>
          console.error("assignBag", e),
        );
    },
    [isSignedIn],
  );

  const value: AppState = {
    profile,
    list,
    bags,
    hydrated,
    serverSynced,
    setProfile,
    toggleListItem,
    isListed: (id) => list.includes(id),
    assignBag,
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
