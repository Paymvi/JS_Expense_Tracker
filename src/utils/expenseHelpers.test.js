// Run with: npm test
// All records here are fictional.

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWeeklySpending,
  countBills,
  getCurrentMonthCount,
  getCurrentMonthTotal,
  getDailyAverage,
  getSpendingExpenses,
  normalizeCategory,
  parseExpenseDate,
} from "./expenseHelpers.js";


test("parseExpenseDate only accepts real YYYY-MM-DD days", () => {
  assert.equal(parseExpenseDate("2026-02-28").getDate(), 28);
  assert.equal(parseExpenseDate("2028-02-29").getMonth(), 1);

  for (const bad of ["", undefined, null, "2026-02-31", "2026-1-5", "2026-13-01", "abc", 20260101]) {
    assert.equal(parseExpenseDate(bad), null, String(bad));
  }
});


test("$400 own + $100 covered: $400 excluded, $500 included, same on every page", () => {
  const now = new Date(2026, 10, 17); // Nov 17, 2026
  const expenses = [
    { id: "a", amount: 250, date: "2026-11-02" },
    { id: "b", amount: 150, date: "2026-11-15" },
    { id: "c", amount: 100, date: "2026-11-10", covered: true },
    { id: "d", amount: 999, date: "2026-10-31" }, // last month
    { id: "e", amount: 50, date: "" }, // no date: never counted
  ];

  const excluded = getSpendingExpenses(expenses, false);
  const included = getSpendingExpenses(expenses, true);

  assert.equal(getCurrentMonthTotal(excluded, now), 400);
  assert.equal(getCurrentMonthCount(excluded, now), 2);
  assert.equal(getDailyAverage(400, now), 400 / 17);

  assert.equal(getCurrentMonthTotal(included, now), 500);
  assert.equal(getCurrentMonthCount(included, now), 3);
});


test("month boundary: the 1st of a month starts a new total", () => {
  const expenses = [
    { amount: 10, date: "2026-11-30" },
    { amount: 5, date: "2026-12-01" },
  ];

  assert.equal(getCurrentMonthTotal(expenses, new Date(2026, 10, 30)), 10);
  assert.equal(getCurrentMonthTotal(expenses, new Date(2026, 11, 1)), 5);
  assert.equal(getDailyAverage(5, new Date(2026, 11, 1)), 5);
});


test("weekly spending follows the `now` it is given", () => {
  const expenses = [{ amount: 7, date: "2026-11-16" }]; // a Monday

  const sunday = buildWeeklySpending(expenses, 2, new Date(2026, 10, 15));
  const monday = buildWeeklySpending(expenses, 2, new Date(2026, 10, 16));

  assert.equal(sunday.at(-1).total, 0);
  assert.equal(monday.at(-1).total, 7);
  assert.equal(monday.at(-1).weekStart.getDate(), 16);
});


test("countBills works in cents", () => {
  assert.deepEqual(countBills(17.35, 5), { billCount: 3, remainder: 2.35 });
  assert.deepEqual(countBills(20, 5), { billCount: 4, remainder: 0 });
  assert.deepEqual(countBills(0.1 + 0.2, 5), { billCount: 0, remainder: 0.3 });
  assert.deepEqual(countBills(4.99, 5), { billCount: 0, remainder: 4.99 });
  assert.deepEqual(countBills(0, 5), { billCount: 0, remainder: 0 });
  assert.deepEqual(countBills(10, 0), { billCount: 0, remainder: 0 });
});


test("category matching uses whole words, not substrings", () => {
  for (const [label, type] of [
    ["Transportation", "transport"],
    ["Gas", "transport"],
    ["Car insurance", "transport"],
    ["Groceries", "groceries"],
    ["Dining Out", "dining"],
    ["Subscriptions", "subscriptions"],
    ["Gifts", "gifts"],
    ["Food", "food"],
    ["Shopping", "shopping"],
    ["Entertainment", "entertainment"],
    ["Bills", "bills"],
    ["Utilities", "bills"],
    ["Health care", "health"],
    ["Other", "other"],
    ["Skincare", "other"],
    ["Vegas trip", "other"],
    ["", "other"],
  ]) {
    assert.equal(normalizeCategory(label), type, label);
  }
});
