// =========================================================
// EXPENSE TRACKER BACKUPS
//
// Handles:
// - Exporting expenses to JSON
// - Reading JSON backups
// - Validating imported expenses
// =========================================================


const BACKUP_VERSION = 1;


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

export function downloadExpenseBackup(
  expenses
) {

  // Wrap the expenses in a backup object rather than
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

  };


  // Make the JSON human-readable.
  const json =
    JSON.stringify(
      backup,
      null,
      2
    );


  // Convert the JSON string into a downloadable file.
  const blob =
    new Blob(
      [json],
      {
        type:
          "application/json",
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  // Create a temporary download link.
  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    `expense-tracker-backup-${getDateStamp()}.json`;


  document.body.appendChild(
    link
  );


  // Trigger the browser download.
  link.click();


  // Clean everything up.
  link.remove();


  URL.revokeObjectURL(
    url
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

      const normalizedExpense = {

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


      // Keep updatedAt only when it exists.
      if (
        typeof expense.updatedAt ===
        "string"
      ) {

        normalizedExpense.updatedAt =
          expense.updatedAt;

      }


      importedExpenses.push(
        normalizedExpense
      );

    }
  );


  return importedExpenses;

}