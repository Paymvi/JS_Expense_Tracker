// Run with: npm test
// All records here are fictional.

import assert from "node:assert/strict";
import test from "node:test";

import {
  createBackupJson,
  InvalidBackupDatesError,
  readExpenseBackup,
} from "./backupHelpers.js";


// Same shape as a File for readExpenseBackup.
const asFile = (json) => ({ text: async () => json });

const asJsonFile = (value) => asFile(JSON.stringify(value));


function sampleData() {
  return {
    expenses: [
      {
        id: "e1",
        amount: 12.5,
        description: "Lunch: Test Cafe",
        category: "Dining Out",
        date: "2026-03-04",
        covered: true,
        createdAt: "2026-03-04T12:00:00.000Z",
        updatedAt: "2026-03-05T08:00:00.000Z",
      },
      {
        id: "e2",
        amount: 40,
        description: "Groceries",
        category: "Groceries",
        date: "2026-03-01",
        createdAt: "2026-03-01T09:00:00.000Z",
      },
    ],
    notes: [
      {
        id: "n1",
        title: "Plan",
        date: "2026-03-02",
        text: "Line one\nLine two",
        fontSize: 18,
        isPinned: true,
        isOpen: true, // legacy display flag
        createdAt: "2026-03-02T10:00:00.000Z",
      },
    ],
    pools: [
      {
        id: "p1",
        name: "Fun",
        description: "",
        createdAt: 1,
        contributions: [
          {
            id: "c1",
            title: "Skipped coffee",
            type: "skipped",
            originalAmount: 5,
            remainingAmount: 2,
            date: "2026-03-01",
            note: "",
            createdAt: 2,
          },
        ],
        spending: [
          {
            id: "s1",
            title: "Movie",
            amount: 3,
            date: "2026-03-03",
            note: "",
            fundingSources: [{ contributionId: "c1", title: "Skipped coffee", type: "skipped", amount: 3 }],
            createdAt: 3,
          },
        ],
      },
    ],
  };
}


test("export -> import round trip keeps expenses, notes and pools", async () => {
  const data = sampleData();

  const json = createBackupJson(data);
  const parsed = JSON.parse(json);

  assert.equal(parsed.app, "expense-tracker");
  assert.equal(parsed.version, 2);
  assert.equal("isOpen" in parsed.notes[0], false, "display state is not exported");

  const backup = await readExpenseBackup(asFile(json));

  assert.deepEqual(backup.expenses, data.expenses);
  assert.deepEqual(backup.pools, data.pools);

  const { isOpen, ...noteWithoutUiState } = data.notes[0];
  assert.equal(isOpen, true);
  assert.deepEqual(backup.notes, [noteWithoutUiState]);
});


test("version 1 backups (expenses only) still import, notes/pools skipped", async () => {
  const backup = await readExpenseBackup(
    asJsonFile({ app: "expense-tracker", version: 1, expenses: sampleData().expenses })
  );

  assert.equal(backup.expenses.length, 2);
  assert.equal(backup.notes, null);
  assert.equal(backup.pools, null);
});


test("legacy isOpen in an imported backup is dropped, note content kept", async () => {
  const backup = await readExpenseBackup(
    asJsonFile({ expenses: [], notes: sampleData().notes })
  );

  assert.equal(backup.notes[0].text, "Line one\nLine two");
  assert.equal("isOpen" in backup.notes[0], false);
});


test("invalid dates are rejected with a message naming each one", async () => {
  const data = sampleData();
  data.expenses[1].date = "";
  data.expenses.push({ id: "e3", amount: 7, description: "Bus", date: "2026-02-31" });

  await assert.rejects(
    readExpenseBackup(asFile(createBackupJson(data))),
    (error) => {
      assert.ok(error instanceof InvalidBackupDatesError);
      assert.equal(error.invalidDates.length, 2);
      assert.match(error.message, /2 transactions have no valid date/);
      assert.match(error.message, /Transaction 2: "Groceries", \$40\.00, date missing/);
      assert.match(error.message, /Transaction 3: "Bus", \$7\.00, date "2026-02-31"/);
      return true;
    }
  );
});


test("allowInvalidDates keeps those expenses with their date unchanged", async () => {
  const data = sampleData();
  data.expenses[1].date = "2026-1-5";

  const backup = await readExpenseBackup(
    asFile(createBackupJson(data)),
    { allowInvalidDates: true }
  );

  assert.equal(backup.expenses.length, 2);
  assert.equal(backup.expenses[1].date, "2026-1-5");
});


test("duplicate ids are rejected within each collection", async () => {
  const dupExpenses = sampleData();
  dupExpenses.expenses[1].id = "e1";

  await assert.rejects(
    readExpenseBackup(asJsonFile(dupExpenses)),
    /Transaction 2 has a duplicate ID/
  );

  const dupNotes = sampleData();
  dupNotes.notes.push({ ...dupNotes.notes[0], title: "Copy" });

  await assert.rejects(
    readExpenseBackup(asJsonFile(dupNotes)),
    /note at position 2 has a duplicate ID/
  );

  const dupPools = sampleData();
  dupPools.pools.push({ ...dupPools.pools[0], name: "Copy" });

  await assert.rejects(
    readExpenseBackup(asJsonFile(dupPools)),
    /pool at position 2 has a duplicate ID/
  );

  // The same id in different collections is fine.
  const crossIds = sampleData();
  crossIds.notes[0].id = "e1";
  crossIds.pools[0].id = "e1";

  await readExpenseBackup(asJsonFile(crossIds));
});


test("a broken notes or pools section is an error, never silently skipped", async () => {
  await assert.rejects(
    readExpenseBackup(asJsonFile({ expenses: [], notes: "oops" })),
    /notes in this backup are not valid/
  );

  await assert.rejects(
    readExpenseBackup(asJsonFile({ expenses: [], pools: [{ id: "p1" }, 42] })),
    /pool at position 2 is not valid/
  );
});


test("bad amounts and non-backup files are rejected", async () => {
  const data = sampleData();
  data.expenses[0].amount = "free";

  await assert.rejects(readExpenseBackup(asJsonFile(data)), /Transaction 1 has an invalid amount/);
  await assert.rejects(readExpenseBackup(asFile("{not json")), /not valid JSON/);
  await assert.rejects(readExpenseBackup(asJsonFile({ hello: 1 })), /does not appear to be/);
});
