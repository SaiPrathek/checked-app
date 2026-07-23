/**
 * Sign-in merge checks — run with: npx tsx scripts/test-sync.ts
 * Exits non-zero on any failure. Covers lib/sync.ts planSync().
 */
import { planSync, type LocalState, type ServerState } from "@/lib/sync";
import { DEFAULT_ACTIVE_BAGS, type BagId, type CustomItem } from "@/lib/types";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const emptyLocal = (): LocalState => ({
  profile: {},
  list: [],
  qty: {},
  alloc: {},
  activeBags: [...DEFAULT_ACTIVE_BAGS],
  customItems: [],
  checkedOff: {},
});
const emptyServer = (): ServerState => ({
  profile: null,
  list: [],
  bags: null,
  custom: [],
  checked: [],
});
const customItem = (id: string): CustomItem => ({
  id,
  name: id,
  category: "misc",
  weightKg: 0.3,
  verdict: "either",
  aiFilled: false,
  createdAt: "2026-01-01T00:00:00.000Z",
});

// ─── Scenario 1: new user, empty server, anonymous local → migrate everything ─
console.log("Scenario 1 · new user (empty server) migrates local up");
{
  const local: LocalState = {
    profile: { university: "ASU", climate: "warm" },
    list: ["laptop", "cooker"],
    qty: { laptop: 1, cooker: 1 },
    alloc: { laptop: { cabin: 1 } },
    activeBags: [...DEFAULT_ACTIVE_BAGS],
    customItems: [customItem("custom:yoga-mat")],
    checkedOff: { "prep-passport": true },
  };
  const plan = planSync(local, emptyServer(), null, "u1");
  check("merged (not replaced)", plan.merged);
  check("state.list = local list", plan.state.list.join() === "laptop,cooker");
  check("state.profile = local profile", plan.state.profile.university === "ASU");
  check("state.alloc preserved", plan.state.alloc["laptop"]?.cabin === 1);
  check("push all list items", plan.push.listItems.length === 2);
  check("push profile", plan.push.profile?.university === "ASU");
  check("push custom item", plan.push.customItems.length === 1);
  check("push checklist key", plan.push.checkedKeys.join() === "prep-passport");
}

// ─── Scenario 2: THE BUG — server has a profile but no list; local built a list ─
console.log("Scenario 2 · server profile but empty list; local-only list is imported");
{
  const local: LocalState = {
    ...emptyLocal(),
    list: ["tshirts"],
    qty: { tshirts: 5 },
  };
  const server: ServerState = { ...emptyServer(), profile: { university: "NEU" } };
  const plan = planSync(local, server, null, "u1");
  check("merged", plan.merged);
  check("local list survives in state", plan.state.list.join() === "tshirts");
  check("local list pushed up (was silently dropped before)", plan.push.listItems.length === 1);
  check("pushed qty carried", plan.push.listItems[0]?.qty === 5);
  check("server profile wins in state", plan.state.profile.university === "NEU");
  check("no profile push (server already has one)", plan.push.profile === null);
}

// ─── Scenario 3: conflict on a shared item → server wins, not re-pushed ───────
console.log("Scenario 3 · shared item conflict resolves to server");
{
  const local: LocalState = { ...emptyLocal(), list: ["rice-dal"], qty: { "rice-dal": 5 } };
  const server: ServerState = {
    ...emptyServer(),
    list: [{ itemId: "rice-dal", qty: 2, allocation: {} }],
  };
  const plan = planSync(local, server, null, "u1");
  check("state qty = server qty (2, not local 5)", plan.state.qty["rice-dal"] === 2);
  check("shared item NOT re-pushed", plan.push.listItems.length === 0);
  check("no duplicate in state list", plan.state.list.filter((x) => x === "rice-dal").length === 1);
}

// ─── Scenario 4: union of list (server + local-only) ─────────────────────────
console.log("Scenario 4 · list union keeps both server and local-only items");
{
  const local: LocalState = { ...emptyLocal(), list: ["a", "b"], qty: { a: 1, b: 1 } };
  const server: ServerState = { ...emptyServer(), list: [{ itemId: "a", qty: 3, allocation: {} }] };
  const plan = planSync(local, server, null, "u1");
  check("state has both a and b", plan.state.list.includes("a") && plan.state.list.includes("b"));
  check("only b pushed (a already on server)", plan.push.listItems.map((r) => r.itemId).join() === "b");
  check("a keeps server qty 3", plan.state.qty["a"] === 3);
}

// ─── Scenario 5: foreign owner → REPLACE, no leak, no push ───────────────────
console.log("Scenario 5 · different account's leftover is replaced, never merged");
{
  const local: LocalState = {
    profile: { university: "LEAK" },
    list: ["secret-item"],
    qty: { "secret-item": 9 },
    alloc: {},
    activeBags: [...DEFAULT_ACTIVE_BAGS],
    customItems: [customItem("custom:leak")],
    checkedOff: { leak: true },
  };
  const server: ServerState = {
    ...emptyServer(),
    profile: { university: "MINE" },
    list: [{ itemId: "my-item", qty: 1, allocation: {} }],
  };
  const plan = planSync(local, server, "userA", "userB"); // owner != signing-in user
  check("replaced (not merged)", !plan.merged);
  check("state = server profile only", plan.state.profile.university === "MINE");
  check("state list = server only", plan.state.list.join() === "my-item");
  check("foreign local item absent", !plan.state.list.includes("secret-item"));
  check("nothing pushed up", plan.push.listItems.length === 0 && plan.push.profile === null && plan.push.customItems.length === 0);
  check("foreign custom items absent", plan.state.customItems.length === 0);
}

// ─── Scenario 6: same-user owner still merges (offline additions) ────────────
console.log("Scenario 6 · same-user owner merges local-only offline additions");
{
  const local: LocalState = { ...emptyLocal(), list: ["offline-add"], qty: { "offline-add": 1 } };
  const server: ServerState = { ...emptyServer(), list: [{ itemId: "synced", qty: 1, allocation: {} }] };
  const plan = planSync(local, server, "u1", "u1"); // owner === signing-in user
  check("merged", plan.merged);
  check("offline addition pushed up", plan.push.listItems.map((r) => r.itemId).join() === "offline-add");
  check("both items in state", plan.state.list.includes("synced") && plan.state.list.includes("offline-add"));
}

// ─── Scenario 7: bags — server wins / customized-local pushed / default not ──
console.log("Scenario 7 · bag-fleet reconciliation");
{
  // 7a: server has bags → server wins, no push
  const p1 = planSync(emptyLocal(), { ...emptyServer(), bags: ["bag1", "cabin"] as BagId[] }, null, "u1");
  check("7a server bags win in state", p1.state.activeBags.join() === "bag1,cabin" || p1.state.activeBags.length === 2);
  check("7a no bag push", p1.push.bags === null);

  // 7b: no server bags, local customized → push local
  const customBags = [...DEFAULT_ACTIVE_BAGS].slice(0, Math.max(1, DEFAULT_ACTIVE_BAGS.length - 1)) as BagId[];
  const localCustom: LocalState = { ...emptyLocal(), activeBags: customBags };
  const p2 = planSync(localCustom, emptyServer(), null, "u1");
  check("7b customized local fleet pushed", p2.push.bags?.join() === customBags.join());

  // 7c: no server bags, local at default → no push
  const p3 = planSync(emptyLocal(), emptyServer(), null, "u1");
  check("7c default fleet not pushed", p3.push.bags === null);
}

// ─── Scenario 8: custom items + checklist union, local-only pushed ───────────
console.log("Scenario 8 · custom items & checklist union");
{
  const local: LocalState = {
    ...emptyLocal(),
    customItems: [customItem("custom:a"), customItem("custom:b")],
    checkedOff: { k1: true, k2: true },
  };
  const server: ServerState = {
    ...emptyServer(),
    custom: [customItem("custom:a")],
    checked: ["k1"],
  };
  const plan = planSync(local, server, null, "u1");
  check("custom union in state (a,b)", plan.state.customItems.map((c) => c.id).sort().join() === "custom:a,custom:b");
  check("only custom:b pushed", plan.push.customItems.map((c) => c.id).join() === "custom:b");
  check("checklist union in state", Boolean(plan.state.checkedOff["k1"] && plan.state.checkedOff["k2"]));
  check("only k2 checklist key pushed", plan.push.checkedKeys.join() === "k2");
}

// ─── Scenario 9: totally empty both sides → clean empty, nothing pushed ──────
console.log("Scenario 9 · empty local + empty server");
{
  const plan = planSync(emptyLocal(), emptyServer(), null, "u1");
  check("empty list state", plan.state.list.length === 0);
  check("empty profile state", Object.keys(plan.state.profile).length === 0);
  check("nothing pushed", plan.push.listItems.length === 0 && plan.push.profile === null && plan.push.bags === null && plan.push.customItems.length === 0 && plan.push.checkedKeys.length === 0);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
