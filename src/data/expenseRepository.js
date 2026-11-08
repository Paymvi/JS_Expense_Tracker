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
} from "./storage";


const COLLECTION =
  "expenses";


function createId() {

  return (
    globalThis.crypto
      ?.randomUUID?.() ??
    `${Date.now()}-${Math.random()}`
  );

}


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

export function addExpense(expense) {

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


export function clearExpenses() {

  replaceCollection(
    COLLECTION,
    []
  );

}
