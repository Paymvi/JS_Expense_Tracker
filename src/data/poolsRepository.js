// =========================================================
// POOLS REPOSITORY
// =========================================================

import {
  getCollection,
  replaceCollection,
} from "./storage.js";


export function getPools() {

  return getCollection("pools");

}


// Saves the full list. Only pools that changed are written.
export function savePools(pools) {

  replaceCollection(
    "pools",
    pools
  );

}
