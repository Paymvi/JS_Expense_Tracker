// =========================================================
// EXPENSE TRACKER BACKUPS
//
// Pure backup format: building the JSON and reading /
// validating it. No file saving or storage here, so it can
// be tested with plain `node --test`.
//
// Version 2 adds optional "notes" and "pools" arrays.
// Version 1 files (expenses only) still import normally.
// =========================================================

import { createId } from "./createId.js";

import {
  formatCurrency,
  parseExpenseDate,
} from "./expenseHelpers.js";


const BACKUP_VERSION = 2;


// Notes used to save whether they were expanded on screen.
// That is display state, so it never goes into new data.
export function stripNoteUiState(note) {

  if (!note || !("isOpen" in note)) {
    return note;
  }

  const copy = { ...note };

  delete copy.isOpen;

  return copy;

}


// =========================================================
// EXPORT
// =========================================================

export function createBackupJson({
  expenses,
  notes,
  pools,
}) {

  // Wrap the data in a backup object rather than
  // exporting the array by itself, so the format can grow.
  return JSON.stringify(
    {
      app: "expense-tracker",
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      expenses,
      notes: notes?.map(stripNoteUiState),
      pools,
    },
    null,
    2
  );

}


// =========================================================
// IMPORT
// =========================================================

// Thrown when the only problem is expenses without a real
// date. `invalidDates` lists them so the user can decide.
export class InvalidBackupDatesError extends Error {

  constructor(invalidDates) {

    const shown =
      invalidDates
        .slice(0, 5)
        .map(describeInvalidDate)
        .join("\n");

    const more =
      invalidDates.length > 5
        ? `\n…and ${invalidDates.length - 5} more.`
        : "";

    super(
      `${invalidDates.length} ${
        invalidDates.length === 1
          ? "transaction has"
          : "transactions have"
      } no valid date (YYYY-MM-DD):\n${shown}${more}`
    );

    this.invalidDates = invalidDates;

  }

}


function describeInvalidDate({ itemNumber, description, amount, date }) {

  const label =
    description ? `"${description}"` : "(no description)";

  const value =
    date === undefined || date === ""
      ? "missing"
      : JSON.stringify(date);

  return `• Transaction ${itemNumber}: ${label}, ${formatCurrency(amount)}, date ${value}`;

}


// file: anything with an async text() method (a File, or
// { text: async () => json } in tests).
//
// allowInvalidDates: keep expenses whose date is not valid,
// unchanged, instead of rejecting the whole backup. Only use
// it after the user agreed; they show up under "Needs a date"
// in Transactions to be fixed.
export async function readExpenseBackup(
  file,
  { allowInvalidDates = false } = {}
) {

  const text =
    await file.text();


  let parsed;

  try {

    parsed =
      JSON.parse(text);

  } catch {

    throw new Error(
      "This file is not valid JSON."
    );

  }


  // Current format: { app, version, expenses: [...] }.
  // A plain array is accepted for older / manual backups.
  const rawExpenses =
    Array.isArray(parsed)
      ? parsed
      : parsed?.expenses;


  if (!Array.isArray(rawExpenses)) {

    throw new Error(
      "This does not appear to be an Expense Tracker backup."
    );

  }


  const importedExpenses = [];

  const invalidDates = [];

  const usedIds =
    new Set();


  rawExpenses.forEach(
    (expense, index) => {

      const itemNumber =
        index + 1;


      if (!isPlainObject(expense)) {

        throw new Error(
          `Transaction ${itemNumber} is not valid.`
        );

      }


      const amount =
        Number(expense.amount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {

        throw new Error(
          `Transaction ${itemNumber} has an invalid amount.`
        );

      }


      // Collect every bad date first so the message can
      // list them all at once.
      if (!parseExpenseDate(expense.date)) {

        invalidDates.push({
          itemNumber,
          description: expense.description,
          amount,
          date: expense.date,
        });

      }


      const id =
        typeof expense.id === "string" &&
        expense.id.trim()
          ? expense.id
          : createId();


      // Editing / deleting relies on every id being unique.
      if (usedIds.has(id)) {

        throw new Error(
          `Transaction ${itemNumber} has a duplicate ID.`
        );

      }

      usedIds.add(id);


      // Start from the original record so fields like
      // "covered" survive a backup round trip.
      const normalizedExpense = {

        ...expense,

        id,

        amount,

        description:
          typeof expense.description === "string"
            ? expense.description
            : "",

        category:
          typeof expense.category === "string" &&
          expense.category.trim()
            ? expense.category
            : "Other",

        // Kept exactly as it was, even when invalid.
        date:
          expense.date,

        createdAt:
          typeof expense.createdAt === "string"
            ? expense.createdAt
            : new Date().toISOString(),

      };


      // Keep updatedAt only when it is valid.
      if (typeof expense.updatedAt !== "string") {
        delete normalizedExpense.updatedAt;
      }


      importedExpenses.push(
        normalizedExpense
      );

    }
  );


  if (
    invalidDates.length > 0 &&
    !allowInvalidDates
  ) {
    throw new InvalidBackupDatesError(invalidDates);
  }


  return {

    expenses:
      importedExpenses,

    notes:
      readOptionalRecords(parsed?.notes, "note")
        ?.map(stripNoteUiState) ?? null,

    pools:
      readOptionalPools(parsed?.pools),

  };

}


// ---------------------------------------------------------
// OPTIONAL SECTIONS (version 2+)
//
// Missing section -> null, so the caller skips it.
// A section that is present but broken is an error: it is
// never skipped silently.
// ---------------------------------------------------------

function isPlainObject(value) {

  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value)
  );

}


function readOptionalRecords(records, label) {

  if (records === undefined || records === null) {
    return null;
  }


  if (!Array.isArray(records)) {

    throw new Error(
      `The ${label}s in this backup are not valid.`
    );

  }


  const usedIds =
    new Set();

  records.forEach(
    (record, index) => {

      if (!isPlainObject(record)) {

        throw new Error(
          `The ${label} at position ${index + 1} is not valid.`
        );

      }


      const id =
        record.id;

      if (id === undefined || id === null) {
        return;
      }

      if (usedIds.has(id)) {

        throw new Error(
          `The ${label} at position ${index + 1} has a duplicate ID.`
        );

      }

      usedIds.add(id);

    }
  );


  return records;

}


function readOptionalPools(pools) {

  const records =
    readOptionalRecords(pools, "pool");

  if (!records) {
    return null;
  }

  return records.map(
    (pool) => ({

      ...pool,

      contributions:
        Array.isArray(pool.contributions)
          ? pool.contributions
          : [],

      spending:
        Array.isArray(pool.spending)
          ? pool.spending
          : [],

    })
  );

}
