// =========================================================
// EXPENSE REPOSITORY
//
// The only place the UI goes to read or change expenses.
// Components never talk to SQLite / localStorage directly.
// =========================================================

import { useSyncExternalStore } from "react";

import {
  getCollection,
  replaceCollection,
  subscribeToCollection,
} from "./storage.js";

import { createId } from "../utils/createId.js";

import { parseExpenseDate } from "../utils/expenseHelpers.js";


const COLLECTION =
  "expenses";


// ---------------------------------------------------------
// READ
// ---------------------------------------------------------

export function getExpenses() {

  return getCollection(COLLECTION);

}


function subscribe(listener) {

  return subscribeToCollection(
    COLLECTION,
    listener
  );

}


// React hook: re-renders whenever expenses change.
export function useExpenses() {

  return useSyncExternalStore(
    subscribe,
    getExpenses
  );

}


// ---------------------------------------------------------
// WRITE
// ---------------------------------------------------------

// Last line of defence: the form already checks this, but an
// undated expense drops out of every total, so never save one.
function assertValidDate(date) {

  if (!parseExpenseDate(date)) {

    throw new Error(
      `Expense date must be a real day (YYYY-MM-DD), got ${JSON.stringify(date)}.`
    );

  }

}


export function addExpense(expense) {

  assertValidDate(expense.date);

  const newExpense = {

    id: createId(),

    ...expense,

    createdAt:
      new Date().toISOString(),

  };


  // Newest first, same as before.
  replaceCollection(
    COLLECTION,
    [
      newExpense,
      ...getExpenses(),
    ]
  );


  return newExpense;

}


export function updateExpense(expenseId, changes) {

  assertValidDate(changes.date);

  replaceCollection(
    COLLECTION,
    getExpenses().map(
      (expense) => {

        // Not the transaction we're editing?
        // Leave it exactly as it is.
        if (expense.id !== expenseId) {
          return expense;
        }


        // Keep the old information,
        // then overwrite the changed fields.
        return {

          ...expense,

          ...changes,

          updatedAt:
            new Date().toISOString(),

        };

      }
    )
  );

}


export function deleteExpense(expenseId) {

  replaceCollection(
    COLLECTION,
    getExpenses().filter(
      (expense) =>
        expense.id !== expenseId
    )
  );

}


// Used by backup import.
export function replaceExpenses(expenses) {

  replaceCollection(
    COLLECTION,
    expenses
  );

}
