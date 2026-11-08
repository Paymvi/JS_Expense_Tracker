// =========================================================
// LOCAL STORAGE LAYER
//
// The single place that knows HOW app data is saved.
//
// - Native app (Android / iOS): SQLite database on the device.
// - Browser (npm run dev / web build): localStorage, using the
//   exact same keys and format the app has always used.
//
// Everything is loaded into memory once at startup
// (initStorage), so components can keep reading data
// synchronously. Every change is written through a queue so
// writes happen in order and never overlap.
// =========================================================

import { Capacitor } from "@capacitor/core";


// ---------------------------------------------------------
// WHAT WE STORE
//
// legacyKey = the localStorage key the web version uses.
// ---------------------------------------------------------

const COLLECTIONS = {

  expenses: {
    table: "expenses",
    legacyKey: "expense-tracker-expenses-v1",
  },

  notes: {
    table: "notes",
    legacyKey: "expense-tracker-notes-v1",
  },

  pools: {
    table: "pools",
    legacyKey: "finance-pools-v1",
  },

};


const SETTINGS = {

  includeCovered:
    "expense-tracker-include-covered-v1",

  hourlyRate:
    "expense-tracker-hourly-rate-v1",

};


const DATABASE_NAME =
  "expense-tracker";

const SCHEMA_VERSION =
  "1";


// ---------------------------------------------------------
// IN-MEMORY STATE
// ---------------------------------------------------------

let backend = null;

let initPromise = null;

// name -> current array (never mutated in place)
const items = {};

// name -> Map(rowKey -> { json, position })
// What we have already sent to the database.
const persisted = {};

// name -> true when the last write failed
const needsResync = {};

// name -> Set of row ids that could not be parsed.
// These are never overwritten or deleted.
const unreadableKeys = {};

// name -> Set of listeners
const listeners = {};

// key -> string value
const settingValues = {};

let writeQueue =
  Promise.resolve();

let lastWriteAlertAt = 0;


export function isNativeApp() {

  return Capacitor.isNativePlatform();

}


export function getStorageBackendName() {

  return backend?.name ?? "not initialized";

}


// =========================================================
// ROW KEYS
//
// Every record is stored under its own id. If a legacy
// record has no usable id, or two records share one, we
// derive a stable key instead of dropping data.
// =========================================================

function buildRowKeys(list) {

  const seen =
    new Set();

  return list.map(
    (item, index) => {

      const rawId =
        item?.id;

      let key =
        (typeof rawId === "string" && rawId.trim()) ||
        typeof rawId === "number"
          ? String(rawId)
          : `__index-${index}`;

      if (seen.has(key)) {

        let copy = 2;

        while (seen.has(`${key}#${copy}`)) {
          copy++;
        }

        key = `${key}#${copy}`;

      }

      seen.add(key);

      return key;

    }
  );

}


// =========================================================
// WEB BACKEND (localStorage)
// =========================================================

function readLegacyArray(key) {

  let raw;

  try {

    raw =
      localStorage.getItem(key);

  } catch (error) {

    console.error(
      `Could not read ${key}:`,
      error
    );

    return { status: "unavailable", list: [] };

  }


  if (!raw) {
    return { status: "empty", list: [] };
  }


  try {

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return { status: "unreadable", raw, list: [] };
    }

    return { status: "ok", list: parsed };

  } catch {

    return { status: "unreadable", raw, list: [] };

  }

}


function preserveUnreadableValue(key, raw) {

  // Never overwrite data we could not understand.
  // Keep a copy next to it so it can be recovered by hand.
  try {

    const backupKey =
      `${key}-unreadable-backup`;

    if (!localStorage.getItem(backupKey)) {

      localStorage.setItem(
        backupKey,
        raw
      );

    }

  } catch (error) {

    console.error(
      `Could not preserve unreadable ${key}:`,
      error
    );

  }

}


function createWebBackend() {

  return {

    name: "localStorage",


    async load() {

      const loaded = {};

      for (const [name, config] of Object.entries(COLLECTIONS)) {

        const result =
          readLegacyArray(config.legacyKey);

        if (result.status === "unreadable") {

          console.error(
            `Saved ${name} could not be read. A copy was kept in ${config.legacyKey}-unreadable-backup.`
          );

          preserveUnreadableValue(
            config.legacyKey,
            result.raw
          );

        }

        loaded[name] =
          result.list;

      }


      const loadedSettings = {};

      for (const key of Object.values(SETTINGS)) {

        try {

          const value =
            localStorage.getItem(key);

          if (value !== null) {
            loadedSettings[key] = value;
          }

        } catch (error) {

          console.error(
            `Could not read ${key}:`,
            error
          );

        }

      }


      return {
        collections: loaded,
        settings: loadedSettings,
      };

    },


    // The web version always saved the whole array,
    // so keep doing exactly that.
    async writeCollection(name, { list }) {

      localStorage.setItem(
        COLLECTIONS[name].legacyKey,
        JSON.stringify(list)
      );

    },


    async writeSetting(key, value) {

      localStorage.setItem(
        key,
        value
      );

    },

  };

}


// =========================================================
// NATIVE BACKEND (SQLite)
// =========================================================

function buildSchemaSql() {

  const collectionTables =
    Object.values(COLLECTIONS)
      .map(
        ({ table }) => `
          CREATE TABLE IF NOT EXISTS ${table} (
            id TEXT PRIMARY KEY NOT NULL,
            position INTEGER NOT NULL,
            data TEXT NOT NULL
          );
        `
      )
      .join("\n");


  return `
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    ${collectionTables}
  `;

}


async function openDatabase() {

  // Only load the SQLite plugin inside the native app.
  const {
    CapacitorSQLite,
    SQLiteConnection,
  } = await import("@capacitor-community/sqlite");


  const sqlite =
    new SQLiteConnection(CapacitorSQLite);


  try {
    await sqlite.checkConnectionsConsistency();
  } catch {
    // Nothing to reconcile on a fresh start.
  }


  const hasConnection =
    (
      await sqlite.isConnection(
        DATABASE_NAME,
        false
      )
    ).result;


  const db =
    hasConnection
      ? await sqlite.retrieveConnection(
          DATABASE_NAME,
          false
        )
      : await sqlite.createConnection(
          DATABASE_NAME,
          false,
          "no-encryption",
          1,
          false
        );


  const isOpen =
    (await db.isDBOpen()).result;

  if (!isOpen) {
    await db.open();
  }


  await db.execute(
    buildSchemaSql(),
    true
  );


  await db.run(
    "INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?);",
    ["schema_version", SCHEMA_VERSION],
    true
  );


  return db;

}


async function readMeta(db, key) {

  const result =
    await db.query(
      "SELECT value FROM meta WHERE key = ?;",
      [key]
    );

  return result.values?.[0]?.value ?? null;

}


// ---------------------------------------------------------
// ONE-TIME MIGRATION: localStorage -> SQLite
//
// Runs once per collection. The rows and the "done" flag are
// written in ONE transaction, so if the app is killed halfway
// nothing is saved and it simply runs again next launch.
// INSERT OR IGNORE means an id already in SQLite is never
// duplicated or overwritten.
//
// The old localStorage values are left untouched as a
// safety copy.
// ---------------------------------------------------------

async function migrateLegacyData(db) {

  for (const [name, config] of Object.entries(COLLECTIONS)) {

    const flagKey =
      `legacy_import_${name}`;

    if (await readMeta(db, flagKey)) {
      continue;
    }


    const result =
      readLegacyArray(config.legacyKey);


    const records =
      result.list.filter(
        (record) =>
          record &&
          typeof record === "object" &&
          !Array.isArray(record)
      );


    const skipped =
      result.list.length - records.length;

    if (skipped > 0) {

      console.warn(
        `Skipped ${skipped} malformed legacy ${name} record(s). The original localStorage data was left untouched.`
      );

    }


    const startResult =
      await db.query(
        `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM ${config.table};`
      );

    const startPosition =
      Number(startResult.values?.[0]?.next) || 0;


    const keys =
      buildRowKeys(records);


    const statements =
      records.map(
        (record, index) => ({
          statement:
            `INSERT OR IGNORE INTO ${config.table} (id, position, data) VALUES (?, ?, ?);`,
          values: [
            keys[index],
            startPosition + index,
            JSON.stringify(record),
          ],
        })
      );


    statements.push({
      statement:
        "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);",
      values: [
        flagKey,
        JSON.stringify({
          status: result.status,
          imported: records.length,
          skipped,
          at: new Date().toISOString(),
        }),
      ],
    });


    await db.executeSet(
      statements,
      true
    );


    if (records.length > 0) {

      console.info(
        `Migrated ${records.length} ${name} record(s) from localStorage to SQLite.`
      );

    }

  }


  if (!(await readMeta(db, "legacy_import_settings"))) {

    const statements = [];

    for (const key of Object.values(SETTINGS)) {

      let value;

      try {
        value = localStorage.getItem(key);
      } catch {
        value = null;
      }

      if (value !== null) {

        statements.push({
          statement:
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);",
          values: [key, value],
        });

      }

    }


    statements.push({
      statement:
        "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);",
      values: [
        "legacy_import_settings",
        new Date().toISOString(),
      ],
    });


    await db.executeSet(
      statements,
      true
    );

  }

}


function createNativeBackend() {

  let db = null;

  return {

    name: "sqlite",


    async load() {

      db =
        await openDatabase();

      await migrateLegacyData(db);


      const loaded = {};

      const rowKeys = {};

      for (const [name, config] of Object.entries(COLLECTIONS)) {

        const result =
          await db.query(
            `SELECT id, position, data FROM ${config.table} ORDER BY position ASC, rowid ASC;`
          );


        loaded[name] = [];

        rowKeys[name] = new Map();


        for (const row of result.values ?? []) {

          try {

            const record =
              JSON.parse(row.data);

            loaded[name].push(record);

            rowKeys[name].set(
              row.id,
              {
                json: row.data,
                position: Number(row.position),
              }
            );

          } catch (error) {

            // Leave the row in the database untouched.
            // It is not added to rowKeys, so it is never
            // overwritten or deleted by later saves.
            unreadableKeys[name] ??= new Set();

            unreadableKeys[name].add(row.id);

            console.error(
              `Could not read ${name} row ${row.id}:`,
              error
            );

          }

        }

      }


      const settingsResult =
        await db.query(
          "SELECT key, value FROM settings;"
        );

      const loadedSettings = {};

      for (const row of settingsResult.values ?? []) {
        loadedSettings[row.key] = row.value;
      }


      return {
        collections: loaded,
        settings: loadedSettings,
        rowKeys,
      };

    },


    async writeCollection(name, { upserts, deletes, fullResync, keepKeys }) {

      const { table } =
        COLLECTIONS[name];


      if (fullResync) {

        const existing =
          await db.query(
            `SELECT id FROM ${table};`
          );

        deletes =
          (existing.values ?? [])
            .map((row) => row.id)
            .filter(
              (key) =>
                !keepKeys.has(key) &&
                !unreadableKeys[name]?.has(key)
            );

      }


      const statements = [

        ...deletes.map(
          (key) => ({
            statement:
              `DELETE FROM ${table} WHERE id = ?;`,
            values: [key],
          })
        ),

        ...upserts.map(
          ({ key, position, json }) => ({
            statement:
              `INSERT OR REPLACE INTO ${table} (id, position, data) VALUES (?, ?, ?);`,
            values: [key, position, json],
          })
        ),

      ];


      if (statements.length === 0) {
        return;
      }


      // One transaction: all of this change is saved,
      // or none of it is.
      await db.executeSet(
        statements,
        true
      );

    },


    async writeSetting(key, value) {

      await db.run(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);",
        [key, value],
        true
      );

    },

  };

}


// =========================================================
// INITIALIZE
// =========================================================

export function initStorage() {

  if (!initPromise) {

    initPromise =
      (async () => {

        backend =
          isNativeApp()
            ? createNativeBackend()
            : createWebBackend();


        const loaded =
          await backend.load();


        for (const name of Object.keys(COLLECTIONS)) {

          const list =
            loaded.collections[name] ?? [];

          items[name] = list;

          listeners[name] ??= new Set();


          if (loaded.rowKeys) {

            persisted[name] =
              loaded.rowKeys[name];

          } else {

            const keys =
              buildRowKeys(list);

            persisted[name] =
              new Map(
                list.map(
                  (record, index) => [
                    keys[index],
                    {
                      json: JSON.stringify(record),
                      position: index,
                    },
                  ]
                )
              );

          }

        }


        Object.assign(
          settingValues,
          loaded.settings
        );

      })();

  }

  return initPromise;

}


// =========================================================
// WRITE QUEUE
// =========================================================

function reportWriteError(error) {

  console.error(
    "Could not save changes:",
    error
  );


  const now =
    Date.now();

  if (now - lastWriteAlertAt > 10000) {

    lastWriteAlertAt = now;

    window.alert(
      "Your latest change could not be saved on this device. " +
      "Please export a backup to be safe."
    );

  }

}


function enqueueWrite(task) {

  writeQueue =
    writeQueue
      .then(task)
      .catch(reportWriteError);

  return writeQueue;

}


// Resolves once every change made so far has been written.
export function flushWrites() {

  return writeQueue;

}


// =========================================================
// COLLECTIONS
// =========================================================

function assertReady() {

  if (!backend) {

    throw new Error(
      "initStorage() must finish before data is used."
    );

  }

}


export function getCollection(name) {

  assertReady();

  return items[name];

}


export function subscribeToCollection(name, listener) {

  listeners[name].add(listener);

  return () => {
    listeners[name].delete(listener);
  };

}


// ---------------------------------------------------------
// POSITIONS
//
// "position" only has to keep records in the same order as
// the array. Records keep their old position whenever the
// order allows it, so adding one expense to the top of the
// list writes one row instead of renumbering every row.
// ---------------------------------------------------------

function assignPositions(keys, previous) {

  const positions =
    new Array(keys.length);


  // 1. Keep old positions that are still in increasing order.
  let lastKept = -Infinity;

  keys.forEach(
    (key, index) => {

      const old =
        previous.get(key)?.position;

      if (
        Number.isInteger(old) &&
        old > lastKept
      ) {

        positions[index] = old;

        lastKept = old;

      }

    }
  );


  // 2. Fill each gap between kept positions.
  let index = 0;

  while (index < keys.length) {

    if (positions[index] !== undefined) {
      index++;
      continue;
    }


    const start = index;

    while (
      index < keys.length &&
      positions[index] === undefined
    ) {
      index++;
    }


    const count =
      index - start;

    const low =
      start > 0
        ? positions[start - 1]
        : null;

    const high =
      index < keys.length
        ? positions[index]
        : null;


    let first;

    if (low === null && high === null) {
      first = 0;
    } else if (low === null) {
      first = high - count;
    } else if (high === null || high - low - 1 >= count) {
      first = low + 1;
    } else {

      // No room between neighbours: renumber everything.
      return keys.map((_, i) => i);

    }


    for (let offset = 0; offset < count; offset++) {
      positions[start + offset] = first + offset;
    }

  }


  return positions;

}


// Save a whole collection. Only records that actually
// changed are written to the database.
export function replaceCollection(name, nextList) {

  assertReady();


  if (!Array.isArray(nextList)) {

    throw new Error(
      `${name} must be an array.`
    );

  }


  if (nextList === items[name]) {
    return;
  }


  const previous =
    persisted[name];

  const keys =
    buildRowKeys(nextList);

  const positions =
    assignPositions(keys, previous);

  const next =
    new Map();

  const upserts = [];


  nextList.forEach(
    (record, index) => {

      const key =
        keys[index];

      const position =
        positions[index];

      const json =
        JSON.stringify(record);

      next.set(
        key,
        { json, position }
      );


      const before =
        previous.get(key);

      if (
        !before ||
        before.json !== json ||
        before.position !== position
      ) {

        upserts.push({ key, position, json });

      }

    }
  );


  const deletes =
    [...previous.keys()].filter(
      (key) => !next.has(key)
    );


  items[name] =
    nextList;

  persisted[name] =
    next;


  listeners[name].forEach(
    (listener) => listener()
  );


  if (upserts.length === 0 && deletes.length === 0) {
    return;
  }


  const fullResync =
    needsResync[name] === true;


  if (
    !fullResync &&
    upserts.length === 0 &&
    deletes.length === 0
  ) {
    return;
  }


  needsResync[name] =
    false;


  enqueueWrite(
    () =>
      backend
        .writeCollection(
          name,
          fullResync
            ? {
                list: nextList,
                fullResync: true,
                upserts: [...next].map(
                  ([key, value]) => ({ key, ...value })
                ),
                keepKeys: new Set(next.keys()),
              }
            : {
                list: nextList,
                upserts,
                deletes,
              }
        )
        .catch((error) => {

          // We no longer know exactly what is on disk, so
          // the next save compares against the database
          // itself and rewrites the whole collection.
          needsResync[name] =
            true;

          throw error;

        })
  );

}


// =========================================================
// SETTINGS (small preferences, stored as strings)
// =========================================================

export function getSetting(name) {

  assertReady();

  return settingValues[SETTINGS[name]] ?? null;

}


export function setSetting(name, value) {

  assertReady();


  const key =
    SETTINGS[name];

  const stringValue =
    String(value);


  if (settingValues[key] === stringValue) {
    return;
  }


  settingValues[key] =
    stringValue;


  enqueueWrite(
    () =>
      backend.writeSetting(
        key,
        stringValue
      )
  );

}
