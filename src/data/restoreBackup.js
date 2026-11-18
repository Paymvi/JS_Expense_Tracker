// =========================================================
// RESTORE A BACKUP
//
// Order matters for safety:
// 1. Read and validate the whole file.
// 2. Ask every question (expenses, notes, pools).
// 3. Only then write. A bad file or a "Cancel" on the first
//    question changes nothing.
//
// `confirm` is passed in (window.confirm in the app) so this
// can be tested without a browser.
// =========================================================

import {
  InvalidBackupDatesError,
  readExpenseBackup,
} from "../utils/backupHelpers.js";

import {
  getExpenses,
  replaceExpenses,
} from "./expenseRepository.js";

import {
  getNotes,
  saveNotes,
} from "./notesRepository.js";

import {
  getPools,
  savePools,
} from "./poolsRepository.js";


const count = (n, word) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;


// Returns a summary message, or null when the user cancelled.
// Throws (with a message for the user) when the file is
// not usable; nothing is written in that case.
export async function restoreBackup(file, { confirm }) {

  let backup;

  try {

    backup =
      await readExpenseBackup(file);

  } catch (error) {

    if (!(error instanceof InvalidBackupDatesError)) {
      throw error;
    }


    // Nothing is dropped or guessed: the user decides,
    // and the records keep their original date value.
    const keepThem =
      confirm(
        `${error.message}\n\n` +
        "Import them anyway with their dates unchanged? " +
        "They will be listed under \"Needs a date\" in " +
        "Transactions so you can fix each one.\n\n" +
        "Cancel = import nothing."
      );

    if (!keepThem) {
      return null;
    }

    backup =
      await readExpenseBackup(
        file,
        { allowInvalidDates: true }
      );

  }


  const replaceCurrentExpenses =
    confirm(
      `This backup contains ${count(backup.expenses.length, "transaction")}.\n\n` +
      `Importing it will replace your current ${count(getExpenses().length, "transaction")}.\n\n` +
      "Continue?"
    );

  if (!replaceCurrentExpenses) {
    return null;
  }


  // Asked separately so nothing is replaced without a clear yes.
  const replaceNotes =
    backup.notes !== null &&
    confirm(
      `This backup also contains ${count(backup.notes.length, "note")}.\n\n` +
      `Replace your current ${count(getNotes().length, "note")} with them?`
    );

  const replacePools =
    backup.pools !== null &&
    confirm(
      `This backup also contains ${count(backup.pools.length, "pool")}.\n\n` +
      `Replace your current ${count(getPools().length, "pool")} with them?`
    );


  // ---- every check and answer is in: now write ----

  replaceExpenses(
    backup.expenses
  );

  const restored = [];

  if (replaceNotes) {

    saveNotes(backup.notes);

    restored.push(count(backup.notes.length, "note"));

  }

  if (replacePools) {

    savePools(backup.pools);

    restored.push(count(backup.pools.length, "pool"));

  }


  return (
    `Imported ${count(backup.expenses.length, "transaction")}` +
    (restored.length > 0 ? ` and ${restored.join(" and ")}` : "") +
    "."
  );

}
