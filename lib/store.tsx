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
import {
  allocatedUnits,
  orderBags,
  DEFAULT_ACTIVE_BAGS,
  type Allocation,
  type BagId,
  type Profile,
} from "./types";
import { PACKING_ITEMS } from "./packing-items";
import { recommendedQty } from "./guidance";
import { migrateProfile } from "./profile";
import { getMyProfile, saveProfile } from "./actions/profile";
import {
  getMyList,
  toggleListItem as serverToggle,
  setAllocation as serverSetAllocation,
  setAllocations as serverSetAllocations,
  setQty as serverSetQty,
  importList,
} from "./actions/list";
import { getMyBagConfig, saveBagConfig } from "./actions/bags";

interface AppState {
  profile: Profile;
  /** ids of PackingItems the user has added to their Manifest */
  list: string[];
  /** per-item quantity; falls back to recommendedQty() when absent */
  qty: Record<string, number>;
  /** per-item, per-bag unit split; units not allocated are unpacked */
  alloc: Record<string, Allocation>;
  /** the user's active Weigh-In fleet (ordered) */
  activeBags: BagId[];
  hydrated: boolean;
  /** true when we've loaded state from the server (signed-in users only) */
  serverSynced: boolean;

  setProfile: (p: Profile) => void;
  toggleListItem: (id: string) => void;
  isListed: (id: string) => boolean;
  setQtyForItem: (id: string, qty: number) => void;
  qtyFor: (id: string) => number;
  /** legacy whole-item move: all units to one bag (undefined = unpack all) */
  assignBag: (id: string, bag: BagId | undefined) => void;
  /** set how many units of an item sit in a specific bag */
  setUnits: (id: string, bag: BagId, units: number) => void;
  /** apply a full Auto-Pack loadsheet in one go */
  applyLoadsheet: (allocMap: Record<string, Allocation>) => void;
  /** add or remove a bag from the fleet; removing returns its units to the tray */
  setBagActive: (id: BagId, active: boolean) => void;
  reset: () => void;
}

const STORAGE_KEY = "checked.v0";
const AppContext = createContext<AppState | null>(null);

interface Persisted {
  profile: Profile;
  list: string[];
  qty: Record<string, number>;
  alloc: Record<string, Allocation>;
  activeBags: BagId[];
}

/** Legacy persisted shape had bags: Record<itemId, BagId>. */
function migrateAlloc(parsed: {
  alloc?: Record<string, Allocation>;
  bags?: Record<string, BagId | undefined>;
  qty?: Record<string, number>;
  list?: string[];
}): Record<string, Allocation> {
  if (parsed.alloc) return parsed.alloc;
  const out: Record<string, Allocation> = {};
  if (parsed.bags) {
    for (const [id, bag] of Object.entries(parsed.bags)) {
      if (!bag) continue;
      const qty = parsed.qty?.[id] ?? 1;
      out[id] = { [bag]: qty };
    }
  }
  return out;
}

function sanitizeActiveBags(v: unknown): BagId[] {
  if (!Array.isArray(v) || v.length === 0) return [...DEFAULT_ACTIVE_BAGS];
  const ordered = orderBags(v as BagId[]);
  return ordered.length ? ordered : [...DEFAULT_ACTIVE_BAGS];
}

function loadLocal(): Persisted {
  const empty: Persisted = {
    profile: {},
    list: [],
    qty: {},
    alloc: {},
    activeBags: [...DEFAULT_ACTIVE_BAGS],
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        profile: migrateProfile(parsed.profile),
        list: parsed.list ?? [],
        qty: parsed.qty ?? {},
        alloc: migrateAlloc(parsed),
        activeBags: sanitizeActiveBags(parsed.activeBags),
      };
    }
  } catch {
    /* ignore */
  }
  return empty;
}

/** Lookup by id — cheap enough that we don't need to memoize. */
const byId = new Map(PACKING_ITEMS.map((i) => [i.id, i]));

/** Clamp an allocation so it never exceeds the item's qty. */
function clampAlloc(a: Allocation, qty: number): Allocation {
  const out: Allocation = {};
  let used = 0;
  for (const bag of ["cabin", "backpack", "bag1", "bag2"] as BagId[]) {
    const take = Math.min(Math.max(0, Math.floor(a[bag] ?? 0)), qty - used);
    if (take > 0) {
      out[bag] = take;
      used += take;
    }
  }
  return out;
}

/** Strip a removed bag out of every item's allocation (units → tray). */
function stripBagFromAllocations(
  allocMap: Record<string, Allocation>,
  bag: BagId,
): Record<string, Allocation> {
  const next: Record<string, Allocation> = {};
  for (const [id, a] of Object.entries(allocMap)) {
    if (a[bag] === undefined) {
      next[id] = a;
      continue;
    }
    const copy = { ...a };
    delete copy[bag];
    next[id] = copy;
  }
  return next;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [profile, setProfileState] = useState<Profile>({});
  const [list, setList] = useState<string[]>([]);
  const [qty, setQtyState] = useState<Record<string, number>>({});
  const [alloc, setAllocState] = useState<Record<string, Allocation>>({});
  const [activeBags, setActiveBagsState] = useState<BagId[]>([...DEFAULT_ACTIVE_BAGS]);
  const [hydrated, setHydrated] = useState(false);
  const [serverSynced, setServerSynced] = useState(false);

  const hydratedForUser = useRef<string | null>(null);
  const profileSaveQueue = useRef<Promise<void>>(Promise.resolve());

  // 1) initial hydrate from localStorage
  useEffect(() => {
    const p = loadLocal();
    setProfileState(p.profile);
    setList(p.list);
    setQtyState(p.qty ?? {});
    setAllocState(p.alloc ?? {});
    setActiveBagsState(p.activeBags);
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
      const [serverProfile, serverList, serverBags] = await Promise.all([
        getMyProfile(),
        getMyList(),
        getMyBagConfig(),
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
              allocation: local.alloc?.[id] ?? {},
            })),
          );
          setList(local.list);
          setQtyState(local.qty ?? {});
          setAllocState(local.alloc ?? {});
        }
        // migrate the local fleet up if the user customized it
        if (serverBags === null && local.activeBags.join() !== DEFAULT_ACTIVE_BAGS.join()) {
          await saveBagConfig(local.activeBags);
          setActiveBagsState(local.activeBags);
        }
      } else {
        if (serverProfile) setProfileState(serverProfile);
        if (serverList.length) {
          setList(serverList.map((r) => r.itemId));
          const q: Record<string, number> = {};
          const a: Record<string, Allocation> = {};
          for (const r of serverList) {
            q[r.itemId] = r.qty;
            if (allocatedUnits(r.allocation) > 0) a[r.itemId] = r.allocation;
          }
          setQtyState(q);
          setAllocState(a);
        }
        if (serverBags) setActiveBagsState(sanitizeActiveBags(serverBags));
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
        JSON.stringify({ profile, list, qty, alloc, activeBags }),
      );
    } catch {
      /* ignore */
    }
  }, [profile, list, qty, alloc, activeBags, hydrated]);

  const setProfile = useCallback(
    (p: Profile) => {
      // Reconcile qtys: any list item whose stored qty still equals the *previous*
      // profile's recommendation gets refreshed to the new profile's recommendation.
      // User overrides (qty !== recommendedQty(prev)) are preserved untouched.
      setQtyState((cur) => {
        const next: Record<string, number> = { ...cur };
        for (const id of list) {
          const item = byId.get(id);
          if (!item) continue;
          const prevRec = Math.max(1, recommendedQty(item, profile));
          const nextRec = Math.max(1, recommendedQty(item, p));
          const stored = cur[id];
          if (stored === undefined || stored === prevRec) {
            if (stored !== nextRec) next[id] = nextRec;
          }
        }
        return next;
      });
      setProfileState(p);
      if (isSignedIn) {
        profileSaveQueue.current = profileSaveQueue.current
          .catch(() => undefined)
          .then(() => saveProfile(p))
          .catch((e) => console.error("saveProfile", e));
      }
    },
    [isSignedIn, list, profile],
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
        setAllocState((cur) => {
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
        setAllocState((cur) => {
          const nx = { ...cur };
          delete nx[id];
          return nx;
        });
      } else {
        setList((cur) => (cur.includes(id) ? cur : [...cur, id]));
        setQtyState((cur) => ({ ...cur, [id]: clean }));
        // shrinking qty below what's packed → clamp the allocation
        setAllocState((cur) => {
          const a = cur[id];
          if (!a || allocatedUnits(a) <= clean) return cur;
          return { ...cur, [id]: clampAlloc(a, clean) };
        });
      }
      if (isSignedIn) serverSetQty(id, clean).catch((e) => console.error("setQty", e));
    },
    [isSignedIn],
  );

  const pushAllocation = useCallback(
    (id: string, a: Allocation) => {
      if (isSignedIn)
        serverSetAllocation(id, a).catch((e) => console.error("setAllocation", e));
    },
    [isSignedIn],
  );

  const assignBag = useCallback(
    (id: string, bag: BagId | undefined) => {
      const a: Allocation = bag ? { [bag]: qtyFor(id) } : {};
      setAllocState((cur) => ({ ...cur, [id]: a }));
      pushAllocation(id, a);
    },
    [pushAllocation, qtyFor],
  );

  const setUnits = useCallback(
    (id: string, bag: BagId, units: number) => {
      setAllocState((cur) => {
        const total = qtyFor(id);
        const current = { ...(cur[id] ?? {}) };
        const others = allocatedUnits(current) - (current[bag] ?? 0);
        const clean = Math.max(0, Math.min(Math.floor(units), total - others));
        if (clean > 0) current[bag] = clean;
        else delete current[bag];
        pushAllocation(id, current);
        return { ...cur, [id]: current };
      });
    },
    [pushAllocation, qtyFor],
  );

  const applyLoadsheet = useCallback(
    (allocMap: Record<string, Allocation>) => {
      setAllocState(allocMap);
      if (isSignedIn) {
        serverSetAllocations(
          Object.entries(allocMap).map(([itemId, allocation]) => ({
            itemId,
            allocation,
          })),
        ).catch((e) => console.error("setAllocations", e));
      }
    },
    [isSignedIn],
  );

  const setBagActive = useCallback(
    (id: BagId, active: boolean) => {
      setActiveBagsState((cur) => {
        const has = cur.includes(id);
        if (active === has) return cur;
        let next: BagId[];
        if (active) {
          next = orderBags([...cur, id]);
        } else {
          if (cur.length <= 1) return cur; // keep at least one bag
          next = cur.filter((b) => b !== id);
          // removing a bag → its packed units go back to the tray
          setAllocState((allocCur) => {
            const stripped = stripBagFromAllocations(allocCur, id);
            if (isSignedIn) {
              serverSetAllocations(
                Object.entries(stripped).map(([itemId, allocation]) => ({
                  itemId,
                  allocation,
                })),
              ).catch((e) => console.error("setAllocations", e));
            }
            return stripped;
          });
        }
        if (isSignedIn) saveBagConfig(next).catch((e) => console.error("saveBagConfig", e));
        return next;
      });
    },
    [isSignedIn],
  );

  const value: AppState = {
    profile,
    list,
    qty,
    alloc,
    activeBags,
    hydrated,
    serverSynced,
    setProfile,
    toggleListItem,
    isListed: (id) => list.includes(id),
    setQtyForItem,
    qtyFor,
    assignBag,
    setUnits,
    applyLoadsheet,
    setBagActive,
    reset: () => {
      setProfileState({});
      setList([]);
      setQtyState({});
      setAllocState({});
      setActiveBagsState([...DEFAULT_ACTIVE_BAGS]);
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
