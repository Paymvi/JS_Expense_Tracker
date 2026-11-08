// =========================================================
// EXPENSE TRACKER BACKUPS
//
// Handles:
// - Exporting expenses (plus notes and pools) to JSON
// - Reading JSON backups
// - Validating imported expenses
//
// Version 2 adds optional "notes" and "pools" arrays.
// Version 1 files (expenses only) still import normally.
// =========================================================

import { saveTextFile } from "./saveFile";


const BACKUP_VERSION = 2;


// ---------------------------------------------------------
// CREATE A UNIQUE ID
// ---------------------------------------------------------

function createId() {

  return (
    globalThis.crypto
      ?.randomUUID?.() ??
    `${Date.now()}-${Math.random()}`
  );

}


// ---------------------------------------------------------
// CHECK IF A DATE IS VALID
//
// Expected:
// YYYY-MM-DD
// ---------------------------------------------------------

function isValidExpenseDate(
  dateString
) {

  if (
    typeof dateString !==
    "string"
  ) {
    return false;
  }


  const match =
    dateString.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );


  if (!match) {
    return false;
  }


  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  return (
    date.getFullYear() === year &&
    date.getMonth() ===
      month - 1 &&
    date.getDate() === day
  );

}


// ---------------------------------------------------------
// LOCAL DATE FOR FILE NAME
//
// Example:
// 2026-08-25
// ---------------------------------------------------------

function getDateStamp() {

  const today =
    new Date();


  const year =
    today.getFullYear();


  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// =========================================================
// EXPORT
// =========================================================

export async function downloadExpenseBackup({
  expenses,
  notes,
  pools,
}) {

  // Wrap the data in a backup object rather than
  // exporting the array by itself.
  //
  // This makes the backup format easier to expand later.
  const backup = {

    app:
      "expense-tracker",

    version:
      BACKUP_VERSION,

    exportedAt:
      new Date().toISOString(),

    expenses,

    notes,

    pools,

  };


  // Make the JSON human-readable.
  const json =
    JSON.stringify(
      backup,
      null,
      2
    );


  await saveTextFile(
    `expense-tracker-backup-${getDateStamp()}.json`,
    json
  );

}


// =========================================================
// IMPORT
// =========================================================

export async function readExpenseBackup(
  file
) {

  // -------------------------------------------------------
  // READ FILE
  // -------------------------------------------------------

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


  // -------------------------------------------------------
  // SUPPORT TWO FORMATS
  // -------------------------------------------------------

  // Current format:
  //
  // {
  //   app: "expense-tracker",
  //   version: 1,
  //   expenses: [...]
  // }
  //
  // We also accept a plain array in case you ever
  // created an older/manual backup.
  const rawExpenses =
    Array.isArray(parsed)
      ? parsed
      : parsed?.expenses;


  if (
    !Array.isArray(
      rawExpenses
    )
  ) {

    throw new Error(
      "This does not appear to be an Expense Tracker backup."
    );

  }


  // -------------------------------------------------------
  // VALIDATE EACH EXPENSE
  // -------------------------------------------------------

  const importedExpenses = [];

  const usedIds =
    new Set();


  rawExpenses.forEach(
    (
      expense,
      index
    ) => {

      const itemNumber =
        index + 1;


      // -----------------------------------------------
      // Expense must be an object.
      // -----------------------------------------------

      if (
        !expense ||
        typeof expense !==
          "object" ||
        Array.isArray(expense)
      ) {

        throw new Error(
          `Transaction ${itemNumber} is not valid.`
        );

      }


      // -----------------------------------------------
      // Amount
      // -----------------------------------------------

      const amount =
        Number(
          expense.amount
        );


      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {

        throw new Error(
          `Transaction ${itemNumber} has an invalid amount.`
        );

      }


      // -----------------------------------------------
      // Date
      // -----------------------------------------------

      if (
        !isValidExpenseDate(
          expense.date
        )
      ) {

        throw new Error(
          `Transaction ${itemNumber} has an invalid date.`
        );

      }


      // -----------------------------------------------
      // ID
      // -----------------------------------------------

      let id =
        typeof expense.id ===
          "string" &&
        expense.id.trim()
          ? expense.id
          : createId();


      // Don't allow duplicate IDs because editing /
      // deleting relies on every expense being unique.
      if (
        usedIds.has(id)
      ) {

        throw new Error(
          `Transaction ${itemNumber} has a duplicate ID.`
        );

      }


      usedIds.add(id);


      // -----------------------------------------------
      // NORMALIZED EXPENSE
      // -----------------------------------------------

      // Start from the original record so fields like
      // "covered" survive a backup round trip.
      const normalizedExpense = {

        ...expense,

        id,

        amount,

        description:
          typeof expense.description ===
          "string"
            ? expense.description
            : "",

        category:
          typeof expense.category ===
            "string" &&
          expense.category.trim()
            ? expense.category
            : "Other",

        date:
          expense.date,

        createdAt:
          typeof expense.createdAt ===
            "string"
            ? expense.createdAt
            : new Date()
                .toISOString(),

      };


      // Keep updatedAt only when it is valid.
      if (
        typeof expense.updatedAt !==
        "string"
      ) {

        delete normalizedExpense.updatedAt;

      }


      importedExpenses.push(
        normalizedExpense
      );

    }
  );


  return {

    expenses:
      importedExpenses,

    notes:
      readOptionalRecords(
        parsed?.notes
      ),

    pools:
      readOptionalPools(
        parsed?.pools
      ),

  };

}


// ---------------------------------------------------------
// OPTIONAL SECTIONS (version 2+)
//
// Returns null when the section is missing or not usable,
// so the caller simply skips it.
// ---------------------------------------------------------

function isPlainObject(value) {

  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value)
  );

}


function readOptionalRecords(records) {

  if (
    !Array.isArray(records) ||
    !records.every(isPlainObject)
  ) {
    return null;
  }

  return records;

}


function readOptionalPools(pools) {

  const records =
    readOptionalRecords(pools);

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