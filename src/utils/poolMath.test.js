// Run with: npm test
// All records here are fictional.

import assert from "node:assert/strict";
import test from "node:test";

import {
  addContribution,
  addSpending,
  deleteContribution,
  deleteSpending,
  getPoolBalance,
  updateContribution,
  updatePool,
  updateSpending,
} from "./poolMath.js";


const contribution = (id, amount, date, remaining = amount) => ({
  id,
  title: `Saved ${id}`,
  type: "skipped",
  originalAmount: amount,
  remainingAmount: remaining,
  date,
  note: "",
  createdAt: 1,
});


// Fun: a=$10 (oldest), b=$20. Travel: t=$5.
function samplePools() {
  return [
    {
      id: "fun",
      name: "Fun",
      description: "",
      contributions: [
        contribution("b", 20, "2026-02-01"),
        contribution("a", 10, "2026-01-01"),
      ],
      spending: [],
    },
    {
      id: "travel",
      name: "Travel",
      description: "",
      contributions: [contribution("t", 5, "2026-01-05")],
      spending: [],
    },
  ];
}


const spendFields = (amount, extra = {}) => ({
  title: "Headphones",
  amount: String(amount),
  date: "2026-03-01",
  note: "",
  ...extra,
});


const pool = (pools, id) => pools.find((item) => item.id === id);


function withSpend(amount) {
  const { pools } = addSpending(samplePools(), "fun", spendFields(amount));
  return { pools, spendId: pool(pools, "fun").spending[0].id };
}


test("spending uses the oldest money first", () => {
  const { pools } = withSpend(15);
  const fun = pool(pools, "fun");

  assert.equal(getPoolBalance(fun), 15);
  assert.deepEqual(
    fun.spending[0].fundingSources.map((s) => [s.contributionId, s.amount]),
    [["a", 10], ["b", 5]]
  );
});


test("spending more than the balance is refused without changes", () => {
  const before = samplePools();
  const result = addSpending(before, "fun", spendFields(31));

  assert.match(result.error, /only has \$30\.00/);
  assert.equal(result.pools, undefined);
  assert.equal(getPoolBalance(pool(before, "fun")), 30);
});


test("editing spending amount re-funds it and keeps the id", () => {
  const { pools, spendId } = withSpend(15);
  const result = updateSpending(pools, "fun", spendId, spendFields(25));
  const fun = pool(result.pools, "fun");

  assert.equal(getPoolBalance(fun), 5);
  assert.equal(fun.spending.length, 1);
  assert.equal(fun.spending[0].id, spendId);
  assert.equal(fun.spending[0].amount, 25);
});


test("editing spending above balance + its own amount is refused", () => {
  const { pools, spendId } = withSpend(15);
  const result = updateSpending(pools, "fun", spendId, spendFields(30.01));

  assert.match(result.error, /only has \$30\.00/);
});


test("text/date-only spending edit keeps the funding split", () => {
  const { pools, spendId } = withSpend(15);
  const before = pool(pools, "fun").spending[0].fundingSources;
  const result = updateSpending(pools, "fun", spendId,
    spendFields(15, { title: "Earbuds", date: "2026-03-09" }));
  const record = pool(result.pools, "fun").spending[0];

  assert.equal(record.title, "Earbuds");
  assert.equal(record.date, "2026-03-09");
  assert.deepEqual(record.fundingSources, before);
});


test("moving spending to another pool updates both pools", () => {
  const { pools, spendId } = withSpend(4);
  const result = updateSpending(pools, "fun", spendId,
    spendFields(4, { poolId: "travel" }));

  assert.equal(getPoolBalance(pool(result.pools, "fun")), 30);
  assert.equal(pool(result.pools, "fun").spending.length, 0);
  assert.equal(getPoolBalance(pool(result.pools, "travel")), 1);
  assert.equal(pool(result.pools, "travel").spending[0].id, spendId);
});


test("moving spending to a pool without enough money is refused", () => {
  const { pools, spendId } = withSpend(15);
  const result = updateSpending(pools, "fun", spendId,
    spendFields(15, { poolId: "travel" }));

  assert.match(result.error, /Travel only has \$5\.00/);
});


test("undoing spending returns the exact money", () => {
  const { pools, spendId } = withSpend(15);
  const result = deleteSpending(pools, "fun", spendId);
  const fun = pool(result.pools, "fun");

  assert.equal(getPoolBalance(fun), 30);
  assert.equal(fun.spending.length, 0);
  assert.ok(fun.contributions.every((c) => c.remainingAmount === c.originalAmount));
});


test("contribution amount can't drop below what was already spent", () => {
  const { pools } = withSpend(15);
  const fields = { title: "Saved b", type: "skipped", date: "2026-02-01", note: "" };

  assert.match(
    updateContribution(pools, "fun", "b", { ...fields, amount: "4" }).error,
    /\$5\.00 of this money/
  );

  const ok = updateContribution(pools, "fun", "b", { ...fields, amount: "12", title: "Skipped takeout" });
  const fun = pool(ok.pools, "fun");
  const b = fun.contributions.find((c) => c.id === "b");

  assert.equal(b.originalAmount, 12);
  assert.equal(b.remainingAmount, 7);
  assert.equal(getPoolBalance(fun), 7);
  // "Funded by" title follows the edit.
  assert.equal(fun.spending[0].fundingSources[1].title, "Skipped takeout");
});


test("only unused contributions can move or be deleted", () => {
  const { pools } = withSpend(15);
  const fields = { title: "x", type: "other", amount: "10", date: "2026-01-01", note: "" };

  assert.ok(updateContribution(pools, "fun", "a", { ...fields, poolId: "travel" }).error);
  assert.ok(deleteContribution(pools, "fun", "a").error);

  const fresh = samplePools();
  const moved = updateContribution(fresh, "fun", "a", { ...fields, poolId: "travel" });

  assert.equal(getPoolBalance(pool(moved.pools, "fun")), 20);
  assert.equal(getPoolBalance(pool(moved.pools, "travel")), 15);
  assert.equal(pool(moved.pools, "travel").contributions[1].id, "a");

  const deleted = deleteContribution(fresh, "fun", "a");
  assert.equal(getPoolBalance(pool(deleted.pools, "fun")), 20);
});


test("invalid input is refused and the input array is untouched", () => {
  const before = samplePools();
  const snapshot = JSON.stringify(before);

  assert.ok(addContribution(before, "fun", { title: "", amount: "5", date: "2026-01-01" }).error);
  assert.ok(addContribution(before, "fun", { title: "x", amount: "0", date: "2026-01-01" }).error);
  assert.ok(addContribution(before, "fun", { title: "x", amount: "abc", date: "2026-01-01" }).error);
  assert.ok(updatePool(before, "fun", { name: "   " }).error);
  assert.equal(JSON.stringify(before), snapshot);
});


test("cents stay exact", () => {
  let { pools } = addContribution([{ id: "p", name: "P", contributions: [], spending: [] }],
    "p", { title: "x", amount: "0.1", date: "2026-01-01" });
  ({ pools } = addContribution(pools, "p", { title: "y", amount: "0.2", date: "2026-01-02" }));
  ({ pools } = addSpending(pools, "p", spendFields(0.3)));

  assert.equal(getPoolBalance(pool(pools, "p")), 0);
  assert.ok(pool(pools, "p").contributions.every((c) => c.remainingAmount === 0));
});


test("archived pools can't receive moved entries", () => {
  const pools = samplePools();
  pools[1] = { ...pools[1], archivedAt: 1 };
  const fields = { title: "x", type: "other", amount: "10", date: "2026-01-01", note: "" };

  assert.match(updateContribution(pools, "fun", "a", { ...fields, poolId: "travel" }).error, /Restore/);
});
