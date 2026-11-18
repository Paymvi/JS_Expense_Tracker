// =========================================================
// NOTES REPOSITORY
// =========================================================

import {
  getCollection,
  replaceCollection,
} from "./storage.js";


export function getNotes() {

  return getCollection("notes");

}


// Saves the full list. Only notes that changed are written.
export function saveNotes(notes) {

  replaceCollection(
    "notes",
    notes
  );

}
