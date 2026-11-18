// Run with: npm test
// All records here are fictional. Uses the real web storage
// backend on an in-memory localStorage (never real data).

import assert from "node:assert/strict";
import test from "node:test";


const store = new Map();

globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const alerts = [];

globalThis.window = { alert: (message) => alerts.push(message) };


const KEYS = {
  expenses: "expense-tracker-expenses-v1",
  notes: "expense-tracker-notes-v1",
  pools: "finance-pools-v1",
};

const current = {
  expenses: [{ id: "old-e", amount: 9, description: "Old", category: "Other", date: "2026-01-02", createdAt: "x" }],
  notes: [{ id: "old-n", title: "Old note", text: "keep me" }],
  pools: [{ id: "old-p", name: "Old pool", contributions: [], spending: [] }],
};

for (const [name, key] of Object.entries(KEYS)) {
  store.set(key, JSON.stringify(current[name]));
}


const { flushWrites, initStorage } = await import("./storage.js");
const { restoreBackup } = await import("./restoreBackup.js");
const { createBackupJson } = await import("../utils/backupHelpers.js");

await initStorage();


const snapshot = () => Object.values(KEYS).map((key) => store.get(key));

const asFile = (json) => ({ text: async () => json });

const backupFile = (expenses) =>
  asFile(
    createBackupJson({
      expenses,
      notes: [{ id: "new-n", title: "New note", text: "hi" }],
      pools: [{ id: "new-p", name: "New pool", contributions: [], spending: [] }],
    })
  );

const validExpense = { id: "new-e", amount: 3, description: "New", category: "Other", date: "2026-05-06", createdAt: "y" };


test("a rejected file changes nothing and asks nothing", async () => {
  const before = snapshot();
  const asked = [];

  const duplicate = backupFile([validExpense, { ...validExpense }]);

  await assert.rejects(
    restoreBackup(duplicate, { confirm: (m) => asked.push(m) }),
    /duplicate ID/
  );

  await assert.rejects(
    restoreBackup(asFile("{broken"), { confirm: (m) => asked.push(m) }),
    /not valid JSON/
  );

  await flushWrites();

  assert.deepEqual(snapshot(), before);
  assert.equal(asked.length, 0);
});


test("invalid dates: declining the offer changes nothing", async () => {
  const before = snapshot();
  const asked = [];

  const result = await restoreBackup(
    backupFile([{ ...validExpense, date: "" }]),
    { confirm: (m) => (asked.push(m), false) }
  );

  await flushWrites();

  assert.equal(result, null);
  assert.equal(asked.length, 1);
  assert.match(asked[0], /no valid date/);
  assert.deepEqual(snapshot(), before);
});


test("cancelling the first question changes nothing", async () => {
  const before = snapshot();

  const result = await restoreBackup(
    backupFile([validExpense]),
    { confirm: () => false }
  );

  await flushWrites();

  assert.equal(result, null);
  assert.deepEqual(snapshot(), before);
});


test("yes to expenses, no to notes and pools: only expenses replaced", async () => {
  const notesBefore = store.get(KEYS.notes);
  const poolsBefore = store.get(KEYS.pools);

  const answers = [true, false, false];

  const result = await restoreBackup(
    backupFile([validExpense]),
    { confirm: () => answers.shift() }
  );

  await flushWrites();

  assert.equal(result, "Imported 1 transaction.");
  assert.deepEqual(JSON.parse(store.get(KEYS.expenses)), [validExpense]);
  assert.equal(store.get(KEYS.notes), notesBefore);
  assert.equal(store.get(KEYS.pools), poolsBefore);
});


test("accepting invalid dates keeps them unchanged, then yes to all", async () => {
  const undated = { ...validExpense, id: "undated", date: "2026-02-31" };

  const result = await restoreBackup(
    backupFile([validExpense, undated]),
    { confirm: () => true }
  );

  await flushWrites();

  assert.equal(result, "Imported 2 transactions and 1 note and 1 pool.");

  const saved = JSON.parse(store.get(KEYS.expenses));
  assert.equal(saved.find((e) => e.id === "undated").date, "2026-02-31");
  assert.equal(JSON.parse(store.get(KEYS.notes))[0].id, "new-n");
  assert.equal(JSON.parse(store.get(KEYS.pools))[0].id, "new-p");
  assert.equal(alerts.length, 0, "no write errors");
});
