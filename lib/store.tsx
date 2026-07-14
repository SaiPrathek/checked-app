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
import { PACKING_ITEMS } from "./packing-items";
import { recommendedQty } from "./guidance";
import { getMyProfile, saveProfile } from "./actions/profile";
import {
  getMyList,
  toggleListItem as serverToggle,
  assignBag as serverAssign,
  setQty as serverSetQty,
  importList,
} from "./actions/list";

interface AppState {
  profile: Profile;
  /** ids of PackingItems the user has added to their Manifest */
  list: string[];
  /** per-item quantity; falls back to recommendedQty() when absent */
  qty: Record<string, number>;
  /** which bag each listed item is assigned to in Weigh-In */
  bags: Record<string, BagId | undefined>;
  hydrated: boolean;
  /** true when we've loaded state from the server (signed-in users only) */
  serverSynced: boolean;

  setProfile: (p: Profile) => void;
  toggleListItem: (id: string) => void;
  isListed: (id: string) => boolean;
  setQtyForItem: (id: string, qty: number) => void;
  qtyFor: (id: string) => number;
  assignBag: (id: string, bag: BagId | undefined) => void;
  reset: () => void;
}

const STORAGE_KEY = "checked.v0";
const AppContext = createContext<AppState | null>(null);

interface Persisted {
  profile: Profile;
  list: string[];
  qty: Record<string, number>;
  bags: Record<string, BagId | undefined>;
}

function loadLocal(): Persisted {
  if (typeof window === "undefined") return { profile: {}, list: [], qty: {}, bags: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { profile: {}, list: [], qty: {}, bags: {}, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { profile: {}, list: [], qty: {}, bags: {} };
}

/** Lookup by id — cheap enough that we don't need to memoize. */
const byId = new Map(PACKING_ITEMS.map((i) => [i.id, i]));

export function AppProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [profile, setProfileState] = useState<Profile>({});
  const [list, setList] = useState<string[]>([]);
  const [qty, setQtyState] = useState<Record<string, number>>({});
  const [bags, setBags] = useState<Record<string, BagId | undefined>>({});
  const [hydrated, setHydrated] = useState(false);
  const [serverSynced, setServerSynced] = useState(false);

  const hydratedForUser = useRef<string | null>(null);

  // 1) initial hydrate from localStorage
  useEffect(() => {
    const p = loadLocal();
    setProfileState(p.profile);
    setList(p.list);
    setQtyState(p.qty ?? {});
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
        if (Object.keys(local.profile).length > 0) {
          await saveProfile(local.profile);
          setProfileState(local.profile);
        }
        if (local.list.length > 0) {
          await importList(
            local.list.map((id) => ({
              itemId: id,
              qty: local.qty?.[id] ?? 1,
              bag: local.bags[id] ?? null,
            })),
          );
          setList(local.list);
          setQtyState(local.qty ?? {});
          setBags(local.bags);
        }
      } else {
        if (serverProfile) setProfileState(serverProfile);
        if (serverList.length) {
          setList(serverList.map((r) => r.itemId));
          const q: Record<string, number> = {};
          const b: Record<string, BagId | undefined> = {};
          for (const r of serverList) {
            q[r.itemId] = r.qty;
            if (r.bag) b[r.itemId] = r.bag;
          }
          setQtyState(q);
          setBags(b);
        }
      }
      setServerSynced(true);
    })().catch((e) => console.error("[Checked] server sync failed", e));
  }, [hydrated, isLoaded, isSignedIn, user]);

  // 3) persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, list, qty, bags }),
      );
    } catch {
      /* ignore */
    }
  }, [profile, list, qty, bags, hydrated]);

  const setProfile = useCallback(
    (p: Profile) => {
      setProfileState(p);
      if (isSignedIn) saveProfile(p).catch((e) => console.error("saveProfile", e));
    },
    [isSignedIn],
  );

  const qtyFor = useCallback(
    (id: string) => {
      if (qty[id] !== undefined) return qty[id];
      const item = byId.get(id);
      return item ? recommendedQty(item, profile) : 1;
    },
    [qty, profile],
  );

  const toggleListItem = useCallback(
    (id: string) => {
      const inList = list.includes(id);
      if (inList) {
        setList((cur) => cur.filter((x) => x !== id));
        setQtyState((cur) => {
          const next = { ...cur };
          delete next[id];
          return next;
        });
      } else {
        const item = byId.get(id);
        const initial = item ? Math.max(1, recommendedQty(item, profile)) : 1;
        setList((cur) => [...cur, id]);
        setQtyState((cur) => ({ ...cur, [id]: initial }));
        if (isSignedIn)
          serverToggle(id, initial).catch((e) => console.error("toggle", e));
        return;
      }
      if (isSignedIn) serverToggle(id).catch((e) => console.error("toggle", e));
    },
    [isSignedIn, list, profile],
  );

  const setQtyForItem = useCallback(
    (id: string, next: number) => {
      const clean = Math.max(0, Math.floor(next));
      if (clean === 0) {
        setList((cur) => cur.filter((x) => x !== id));
        setQtyState((cur) => {
          const nx = { ...cur };
          delete nx[id];
          return nx;
        });
      } else {
        setList((cur) => (cur.includes(id) ? cur : [...cur, id]));
        setQtyState((cur) => ({ ...cur, [id]: clean }));
      }
      if (isSignedIn) serverSetQty(id, clean).catch((e) => console.error("setQty", e));
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
    qty,
    bags,
    hydrated,
    serverSynced,
    setProfile,
    toggleListItem,
    isListed: (id) => list.includes(id),
    setQtyForItem,
    qtyFor,
    assignBag,
    reset: () => {
      setProfileState({});
      setList([]);
      setQtyState({});
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
