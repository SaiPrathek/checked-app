import {
  allocatedUnits,
  orderBags,
  DEFAULT_ACTIVE_BAGS,
  type Allocation,
  type BagId,
  type CustomItem,
  type Profile,
} from "./types";

/**
 * Pure sign-in merge logic, extracted from lib/store.tsx so it can be unit
 * tested without React/Clerk/DB. Given the anonymous/local state and the
 * signed-in user's server state, decide the resulting in-memory state and the
 * set of writes that must be pushed up. No side effects, no I/O.
 */

/** The local (localStorage) slices relevant to sync. Mirrors loadLocal()'s shape. */
export interface LocalState {
  profile: Profile;
  list: string[];
  qty: Record<string, number>;
  alloc: Record<string, Allocation>;
  activeBags: BagId[];
  // optional to match Persisted (loadLocal defaults them); handled via ?? below
  customItems?: CustomItem[];
  checkedOff?: Record<string, boolean>;
}

export interface ServerListRow {
  itemId: string;
  qty: number;
  allocation: Allocation;
}

/** What the server actions returned for this user. */
export interface ServerState {
  profile: Profile | null;
  list: ServerListRow[];
  bags: BagId[] | null;
  custom: CustomItem[];
  checked: string[];
}

/** The in-memory state to apply after sync. */
export interface MergedState {
  profile: Profile;
  list: string[];
  qty: Record<string, number>;
  alloc: Record<string, Allocation>;
  activeBags: BagId[];
  customItems: CustomItem[];
  checkedOff: Record<string, boolean>;
}

/** Writes to push to the server (empty in the replace case). */
export interface SyncPush {
  listItems: ServerListRow[];
  profile: Profile | null;
  bags: BagId[] | null;
  customItems: CustomItem[];
  checkedKeys: string[];
}

export interface SyncPlan {
  /** true = merged local into server; false = replaced local with server (foreign owner). */
  merged: boolean;
  state: MergedState;
  push: SyncPush;
}

/** Clamp/dedupe the active-bag list; fall back to the default fleet. */
export function sanitizeActiveBags(v: unknown): BagId[] {
  if (!Array.isArray(v) || v.length === 0) return [...DEFAULT_ACTIVE_BAGS];
  const ordered = orderBags(v as BagId[]);
  return ordered.length ? ordered : [...DEFAULT_ACTIVE_BAGS];
}

function stateFromRows(rows: ServerListRow[]): Pick<MergedState, "list" | "qty" | "alloc"> {
  const list = rows.map((r) => r.itemId);
  const qty: Record<string, number> = {};
  const alloc: Record<string, Allocation> = {};
  for (const r of rows) {
    qty[r.itemId] = r.qty;
    if (allocatedUnits(r.allocation) > 0) alloc[r.itemId] = r.allocation;
  }
  return { list, qty, alloc };
}

const EMPTY_PUSH: SyncPush = {
  listItems: [],
  profile: null,
  bags: null,
  customItems: [],
  checkedKeys: [],
};

/**
 * Decide how to reconcile local and server state on sign-in.
 *
 * @param owner  which account the local state belongs to (localStorage tag),
 *               or null for anonymous/legacy data.
 * @param userId the id of the user now signing in.
 *
 * Merge (owner is null or === userId): server value wins on conflict, and every
 * local-only addition is pushed up so logged-out work is never dropped.
 * Replace (owner is a different user's id): use the signing-in user's server
 * state verbatim so no data leaks between accounts on a shared browser.
 */
export function planSync(
  local: LocalState,
  server: ServerState,
  owner: string | null,
  userId: string,
): SyncPlan {
  const canMerge = !owner || owner === userId;

  if (!canMerge) {
    return {
      merged: false,
      state: {
        profile: server.profile ?? {},
        ...stateFromRows(server.list),
        activeBags: server.bags ? sanitizeActiveBags(server.bags) : [...DEFAULT_ACTIVE_BAGS],
        customItems: server.custom,
        checkedOff: Object.fromEntries(server.checked.map((k) => [k, true])),
      },
      push: EMPTY_PUSH,
    };
  }

  // ---- LIST: union; local-only items get pushed up (server rows win on conflict). ----
  const serverIds = new Set(server.list.map((r) => r.itemId));
  const localOnly: ServerListRow[] = local.list
    .filter((id) => !serverIds.has(id))
    .map((id) => ({
      itemId: id,
      qty: Math.max(1, Math.floor(local.qty?.[id] ?? 1)),
      allocation: local.alloc?.[id] ?? {},
    }));
  const mergedRows = [...server.list, ...localOnly];

  // ---- PROFILE: server wins if present, else push local up. ----
  const localHasProfile = Object.keys(local.profile ?? {}).length > 0;
  const profile = server.profile ?? (localHasProfile ? local.profile : {});
  const pushProfile = !server.profile && localHasProfile ? local.profile : null;

  // ---- BAGS: server wins if present, else push a customized local fleet up. ----
  const localCustomizedBags = local.activeBags.join() !== DEFAULT_ACTIVE_BAGS.join();
  const activeBags = server.bags ? sanitizeActiveBags(server.bags) : local.activeBags;
  const pushBags = !server.bags && localCustomizedBags ? local.activeBags : null;

  // ---- CUSTOM ITEMS: union by id; push local-only up. ----
  const serverCustomIds = new Set(server.custom.map((c) => c.id));
  const localOnlyCustom = (local.customItems ?? []).filter((c) => !serverCustomIds.has(c.id));
  const customItems = [...server.custom, ...localOnlyCustom];

  // ---- CHECKLIST TICKS: union; push local-only ticks up. ----
  const serverCheckedSet = new Set(server.checked);
  const localChecked = Object.keys(local.checkedOff ?? {}).filter((k) => local.checkedOff?.[k]);
  const localOnlyChecked = localChecked.filter((k) => !serverCheckedSet.has(k));
  const mergedChecked = [...new Set([...server.checked, ...localChecked])];

  return {
    merged: true,
    state: {
      profile,
      ...stateFromRows(mergedRows),
      activeBags,
      customItems,
      checkedOff: Object.fromEntries(mergedChecked.map((k) => [k, true])),
    },
    push: {
      listItems: localOnly,
      profile: pushProfile,
      bags: pushBags,
      customItems: localOnlyCustom,
      checkedKeys: localOnlyChecked,
    },
  };
}
