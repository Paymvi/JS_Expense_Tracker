// Run with: npm test
// All records here are fictional.
//
// These run the real storage.js logic (position assignment,
// which rows get written / moved / deleted, the resync after
// a failed write, protection of unreadable rows) against a
// tiny in-memory stand-in for the SQLite plugin. They do NOT
// prove real Android SQLite behaviour: that needs a device.

import assert from "node:assert/strict";
import test from "node:test";


const alerts = [];

globalThis.window = { alert: (message) => alerts.push(message) };


const {
  assignPositions,
  createNativeBackend,
  flushWrites,
  getCollection,
  initStorage,
  replaceCollection,
} = await import("./storage.js");


// ---------------------------------------------------------
// assignPositions (pure)
// ---------------------------------------------------------

const previous = (entries) =>
  new Map(entries.map(([key, position]) => [key, { json: "{}", position }]));


test("insert at the top keeps every existing position", () => {
  const before = previous([["a", 0], ["b", 1], ["c", 2]]);

  assert.deepEqual(
    assignPositions(["new", "a", "b", "c"], before),
    [-1, 0, 1, 2]
  );
});


test("delete from the middle keeps the rest unchanged", () => {
  const before = previous([["a", 0], ["b", 1], ["c", 2]]);

  assert.deepEqual(assignPositions(["a", "c"], before), [0, 2]);
});


test("insert into a gap uses the free positions", () => {
  const before = previous([["a", 0], ["c", 5]]);

  assert.deepEqual(assignPositions(["a", "x", "y", "c"], before), [0, 1, 2, 5]);
});


test("no room between neighbours renumbers everything", () => {
  const before = previous([["a", 0], ["b", 1]]);

  assert.deepEqual(assignPositions(["a", "x", "b"], before), [0, 1, 2]);
});


test("a moved record gets a new position, order stays as given", () => {
  const before = previous([["a", 0], ["b", 1], ["c", 2]]);

  // "c" moved to the front: the first increasing run keeps
  // c=2, and a, b get the next free positions after it.
  const positions = assignPositions(["c", "a", "b"], before);

  assert.deepEqual(positions, [2, 3, 4]);
});


// ---------------------------------------------------------
// replaceCollection through the native backend + fake db
// ---------------------------------------------------------

// Understands exactly the statements storage.js sends.
function createFakeDb() {
  const tables = {
    expenses: new Map(),
    notes: new Map(),
    pools: new Map(),
  };

  const db = {
    tables,
    executed: [],
    failNextWrite: false,

    async query(sql) {
      if (sql.startsWith("SELECT value FROM meta")) {
        // Legacy import already done.
        return { values: [{ value: "done" }] };
      }

      if (sql.startsWith("SELECT key, value FROM settings")) {
        return { values: [] };
      }

      const table = sql.match(/FROM (\w+)/)[1];

      const rows = [...tables[table]].map(([id, row]) => ({ id, ...row }));

      if (sql.startsWith("SELECT id, position, data")) {
        return { values: rows.sort((a, b) => a.position - b.position) };
      }

      if (sql.startsWith("SELECT id FROM")) {
        return { values: rows.map(({ id }) => ({ id })) };
      }

      throw new Error(`Fake db does not know: ${sql}`);
    },

    // One transaction: all statements apply, or none.
    async executeSet(statements) {
      if (db.failNextWrite) {
        db.failNextWrite = false;
        throw new Error("disk full (fake)");
      }

      const staged = Object.fromEntries(
        Object.entries(tables).map(([name, rows]) => [name, new Map(rows)])
      );

      for (const { statement, values } of statements) {
        const table = statement.match(/(?:INTO|FROM) (\w+)/)[1];

        if (statement.startsWith("DELETE")) {
          staged[table].delete(values[0]);
        } else if (statement.startsWith("INSERT OR REPLACE")) {
          staged[table].set(values[0], { position: values[1], data: values[2] });
        } else {
          throw new Error(`Fake db does not know: ${statement}`);
        }
      }

      Object.assign(tables, staged);
      db.executed.push(statements);
    },
  };

  return db;
}


const row = (id, position, record) => [id, { position, data: JSON.stringify(record) }];

const db = createFakeDb();

db.tables.expenses = new Map([
  row("a", 0, { id: "a", amount: 1 }),
  row("b", 1, { id: "b", amount: 2 }),
  row("c", 2, { id: "c", amount: 3 }),
  // A row that cannot be parsed must survive everything.
  ["broken", { position: 3, data: "{not json" }],
]);

const consoleError = console.error;
console.error = () => {}; // the unreadable row is reported on load
await initStorage({ backend: createNativeBackend(async () => db) });
console.error = consoleError;


const lastWrite = () => db.executed.at(-1).map(({ statement, values }) => [statement.split(" ")[0], values[0]]);

const savedIds = () =>
  [...db.tables.expenses]
    .sort((x, y) => x[1].position - y[1].position)
    .map(([id]) => id);


test("load skips the unreadable row but keeps it on disk", () => {
  assert.deepEqual(getCollection("expenses").map((e) => e.id), ["a", "b", "c"]);
  assert.ok(db.tables.expenses.has("broken"));
});


test("adding at the top writes exactly one row", async () => {
  replaceCollection("expenses", [{ id: "n", amount: 9 }, ...getCollection("expenses")]);
  await flushWrites();

  assert.deepEqual(lastWrite(), [["INSERT", "n"]]);
  assert.deepEqual(savedIds(), ["n", "a", "b", "c", "broken"]);
});


test("editing one record rewrites only that row", async () => {
  replaceCollection(
    "expenses",
    getCollection("expenses").map((e) => (e.id === "b" ? { ...e, amount: 20 } : e))
  );
  await flushWrites();

  assert.deepEqual(lastWrite(), [["INSERT", "b"]]);
  assert.equal(JSON.parse(db.tables.expenses.get("b").data).amount, 20);
});


test("deleting from the middle deletes one row, moves nothing", async () => {
  const writesBefore = db.executed.length;

  replaceCollection("expenses", getCollection("expenses").filter((e) => e.id !== "a"));
  await flushWrites();

  assert.equal(db.executed.length, writesBefore + 1);
  assert.deepEqual(lastWrite(), [["DELETE", "a"]]);
  assert.deepEqual(savedIds(), ["n", "b", "c", "broken"]);
});


test("no change, no write", async () => {
  const writesBefore = db.executed.length;

  replaceCollection("expenses", [...getCollection("expenses")]);
  await flushWrites();

  assert.equal(db.executed.length, writesBefore);
});


test("after a failed write the next save resyncs the whole table, keeping the unreadable row", async () => {
  db.failNextWrite = true;

  replaceCollection("expenses", [...getCollection("expenses"), { id: "lost", amount: 4 }]);
  await flushWrites();

  assert.equal(alerts.length, 1, "user was told the save failed");
  assert.equal(db.tables.expenses.has("lost"), false);

  // Next change: disk must end up matching memory exactly.
  replaceCollection("expenses", getCollection("expenses").filter((e) => e.id !== "n"));
  await flushWrites();

  assert.deepEqual(savedIds().filter((id) => id !== "broken"), ["b", "c", "lost"]);
  assert.equal(db.tables.expenses.get("broken").data, "{not json");
});
