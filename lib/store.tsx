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
  isCustomItemId,
  orderBags,
  DEFAULT_ACTIVE_BAGS,
  type Allocation,
  type BagId,
  type CustomItem,
  type Packable,
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
import {
  getMyCustomItems,
  saveCustomItem as serverSaveCustomItem,
  deleteCustomItem as serverDeleteCustomItem,
} from "./actions/custom";
import {
  getMyChecklist,
  setChecklistCheck as serverSetChecklistCheck,
  setChecklistChecks as serverSetChecklistChecks,
} from "./actions/checklist";
import { planSync, sanitizeActiveBags } from "./sync";

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
  /** user-defined items (id prefix "custom:") — persist in localStorage + Neon */
  customItems: CustomItem[];
  /** gather/prep checklist tick state, keyed by ChecklistRow.id (done-tracker only) */
  checkedOff: Record<string, boolean>;
  hydrated: boolean;
  /** true when we've loaded state from the server (signed-in users only) */
  serverSynced: boolean;
  /** true when a background save/sync to the server failed (signed-in users) */
  syncError: boolean;
  /** dismiss the sync-error banner */
  dismissSyncError: () => void;

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
  /** create or update a user-defined item; persists to localStorage + server */
  saveCustomItem: (item: CustomItem) => void;
  /** remove a user-defined item and any list/allocation entries for it */
  removeCustomItem: (id: string) => void;
  /** unified item lookup — returns PackingItem or CustomItem, whichever exists */
  getPackable: (id: string) => Packable | undefined;
  /** checklist tick state */
  isChecked: (key: string) => boolean;
  setChecked: (key: string, checked: boolean) => void;
  /** bulk tick/untick — Check all / Clear on a category */
  setCheckedMany: (keys: string[], checked: boolean) => void;
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
  customItems?: CustomItem[];
  checkedOff?: Record<string, boolean>;
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


/**
 * Which account the local state belongs to. Lets sign-in tell apart
 * "anonymous work by the person now signing in" (merge it up) from "a different
 * user's leftover on a shared browser" (never merge — replace it). Unset =
 * anonymous / legacy, which merges (preserves the primary funnel).
 */
const OWNER_KEY = "checked.owner.v0";
function readOwner(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}
function writeOwner(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OWNER_KEY, id);
  } catch {
    /* ignore */
  }
}

function loadLocal(): Persisted {
  const empty: Persisted = {
    profile: {},
    list: [],
    qty: {},
    alloc: {},
    activeBags: [...DEFAULT_ACTIVE_BAGS],
    customItems: [],
    checkedOff: {},
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
        customItems: Array.isArray(parsed.customItems) ? (parsed.customItems as CustomItem[]) : [],
        checkedOff:
          parsed.checkedOff && typeof parsed.checkedOff === "object" ? parsed.checkedOff : {},
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
  const [customItems, setCustomItemsState] = useState<CustomItem[]>([]);
  const [checkedOff, setCheckedOffState] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [serverSynced, setServerSynced] = useState(false);
  const [syncError, setSyncError] = useState(false);

  const hydratedForUser = useRef<string | null>(null);
  const profileSaveQueue = useRef<Promise<void>>(Promise.resolve());

  // Shared rejection handler for the fire-and-forget server writes below: log it
  // and raise the sync-error flag so the UI can tell the user their change may
  // not have been saved (local state + localStorage still hold it).
  const onSyncFail = useCallback(
    (label: string) => (e: unknown) => {
      console.error(label, e);
      setSyncError(true);
    },
    [],
  );

  // 1) initial hydrate from localStorage
  useEffect(() => {
    const p = loadLocal();
    setProfileState(p.profile);
    setList(p.list);
    setQtyState(p.qty ?? {});
    setAllocState(p.alloc ?? {});
    setActiveBagsState(p.activeBags);
    setCustomItemsState(p.customItems ?? []);
    setCheckedOffState(p.checkedOff ?? {});
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
      const [serverProfile, serverList, serverBags, serverCustom, serverChecked] = await Promise.all([
        getMyProfile(),
        getMyList(),
        getMyBagConfig(),
        getMyCustomItems(),
        getMyChecklist(),
      ]);

      // Decide the merge with the pure planner (see lib/sync.ts; unit-tested in
      // scripts/test-sync.ts). It reconciles local + server given the owner tag:
      // merge local-only additions up when the data is anonymous or ours, or
      // replace with server state when it belongs to a different account.
      const plan = planSync(
        loadLocal(),
        {
          profile: serverProfile,
          list: serverList,
          bags: serverBags,
          custom: serverCustom,
          checked: serverChecked,
        },
        readOwner(),
        user.id,
      );

      // Apply the resulting in-memory state immediately.
      setProfileState(plan.state.profile);
      setList(plan.state.list);
      setQtyState(plan.state.qty);
      setAllocState(plan.state.alloc);
      setActiveBagsState(plan.state.activeBags);
      setCustomItemsState(plan.state.customItems);
      setCheckedOffState(plan.state.checkedOff);

      // Push local-only additions up (no-ops in the replace case). Each is
      // independent — one failure surfaces the sync-error banner but doesn't
      // block the others.
      if (plan.push.listItems.length) {
        await importList(plan.push.listItems).catch(onSyncFail("importList"));
      }
      if (plan.push.profile) {
        await saveProfile(plan.push.profile).catch(onSyncFail("saveProfile"));
      }
      if (plan.push.bags) {
        await saveBagConfig(plan.push.bags).catch(onSyncFail("saveBagConfig"));
      }
      for (const ci of plan.push.customItems) {
        await serverSaveCustomItem(ci).catch(onSyncFail("saveCustomItem"));
      }
      if (plan.push.checkedKeys.length) {
        await serverSetChecklistChecks(plan.push.checkedKeys, true).catch(
          onSyncFail("setChecklistChecks"),
        );
      }

      writeOwner(user.id);
      setServerSynced(true);
    })().catch((e) => {
      console.error("[Checked] server sync failed", e);
      setSyncError(true);
      // Unblock the UI even when the pull fails — render local data (kept in
      // localStorage) alongside the sync-error banner, rather than stranding
      // signed-in users on the loading gate forever.
      setServerSynced(true);
    });
  }, [hydrated, isLoaded, isSignedIn, user]);

  // 3) persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, list, qty, alloc, activeBags, customItems, checkedOff }),
      );
    } catch {
      /* ignore */
    }
  }, [profile, list, qty, alloc, activeBags, customItems, checkedOff, hydrated]);

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
          .catch(onSyncFail("saveProfile"));
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
          serverToggle(id, initial).catch(onSyncFail("toggle"));
        return;
      }
      if (isSignedIn) serverToggle(id).catch(onSyncFail("toggle"));
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
      if (isSignedIn) serverSetQty(id, clean).catch(onSyncFail("setQty"));
    },
    [isSignedIn],
  );

  const pushAllocation = useCallback(
    (id: string, a: Allocation) => {
      if (isSignedIn)
        serverSetAllocation(id, a).catch(onSyncFail("setAllocation"));
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
        ).catch(onSyncFail("setAllocations"));
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
              ).catch(onSyncFail("setAllocations"));
            }
            return stripped;
          });
        }
        if (isSignedIn) saveBagConfig(next).catch(onSyncFail("saveBagConfig"));
        return next;
      });
    },
    [isSignedIn],
  );

  const saveCustomItem = useCallback(
    (item: CustomItem) => {
      setCustomItemsState((cur) => {
        const idx = cur.findIndex((c) => c.id === item.id);
        if (idx >= 0) {
          const next = [...cur];
          next[idx] = item;
          return next;
        }
        return [...cur, item];
      });
      if (isSignedIn) serverSaveCustomItem(item).catch(onSyncFail("saveCustomItem"));
    },
    [isSignedIn],
  );

  const removeCustomItem = useCallback(
    (id: string) => {
      setCustomItemsState((cur) => cur.filter((c) => c.id !== id));
      // also remove it from list/qty/alloc if present
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
      if (isSignedIn) serverDeleteCustomItem(id).catch(onSyncFail("deleteCustomItem"));
    },
    [isSignedIn],
  );

  const getPackable = useCallback(
    (id: string): Packable | undefined => {
      if (isCustomItemId(id)) return customItems.find((c) => c.id === id);
      return byId.get(id);
    },
    [customItems],
  );

  const setChecked = useCallback(
    (key: string, checked: boolean) => {
      setCheckedOffState((cur) => {
        if (checked) return { ...cur, [key]: true };
        const next = { ...cur };
        delete next[key];
        return next;
      });
      if (isSignedIn)
        serverSetChecklistCheck(key, checked).catch(onSyncFail("setChecklistCheck"));
    },
    [isSignedIn],
  );

  const setCheckedMany = useCallback(
    (keys: string[], checked: boolean) => {
      setCheckedOffState((cur) => {
        const next = { ...cur };
        for (const k of keys) {
          if (checked) next[k] = true;
          else delete next[k];
        }
        return next;
      });
      if (isSignedIn)
        serverSetChecklistChecks(keys, checked).catch(onSyncFail("setChecklistChecks"));
    },
    [isSignedIn],
  );

  const value: AppState = {
    profile,
    list,
    qty,
    alloc,
    activeBags,
    customItems,
    checkedOff,
    hydrated,
    serverSynced,
    syncError,
    dismissSyncError: () => setSyncError(false),
    setProfile,
    toggleListItem,
    isListed: (id) => list.includes(id),
    setQtyForItem,
    qtyFor,
    assignBag,
    setUnits,
    applyLoadsheet,
    setBagActive,
    saveCustomItem,
    removeCustomItem,
    getPackable,
    isChecked: (key) => Boolean(checkedOff[key]),
    setChecked,
    setCheckedMany,
    reset: () => {
      setProfileState({});
      setList([]);
      setQtyState({});
      setAllocState({});
      setActiveBagsState([...DEFAULT_ACTIVE_BAGS]);
      setCustomItemsState([]);
      setCheckedOffState({});
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
