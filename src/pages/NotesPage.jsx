import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


// =========================================================
// STORAGE
// =========================================================

const NOTES_STORAGE_KEY =
  "expense-tracker-notes-v1";


// =========================================================
// DATE HELPERS
// =========================================================

function getTodayDate() {

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


// ---------------------------------------------------------
// DISPLAY DATE
//
// 2026-08-25
// becomes
// August 25, 2026
// ---------------------------------------------------------

function formatNoteDate(
  dateString
) {

  if (!dateString) {
    return "";
  }


  const match =
    dateString.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );


  if (!match) {
    return dateString;
  }


  const [
    ,
    year,
    month,
    day,
  ] = match;


  const date =
    new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );


  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

}


// ---------------------------------------------------------
// NORMALIZE OLD / IMPORTED DATES
// ---------------------------------------------------------

function normalizeNoteDate(
  dateString
) {

  if (!dateString) {
    return getTodayDate();
  }


  // Already YYYY-MM-DD
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    return dateString;
  }


  const parsed =
    new Date(
      dateString
    );


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return getTodayDate();
  }


  const year =
    parsed.getFullYear();


  const month =
    String(
      parsed.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      parsed.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// =========================================================
// SEARCH PREVIEW
// =========================================================

function getSearchSnippet(
  text,
  query
) {

  if (!text) {
    return "";
  }


  const cleanQuery =
    query
      .trim()
      .toLowerCase();


  if (!cleanQuery) {

    return text.length > 120
      ? `${text.slice(0, 120)}...`
      : text;

  }


  const lowerText =
    text.toLowerCase();


  const matchIndex =
    lowerText.indexOf(
      cleanQuery
    );


  // Query might only exist in the title/date.
  if (matchIndex === -1) {

    return text.length > 120
      ? `${text.slice(0, 120)}...`
      : text;

  }


  const start =
    Math.max(
      0,
      matchIndex - 45
    );


  const end =
    Math.min(
      text.length,
      matchIndex +
        cleanQuery.length +
        75
    );


  const snippet =
    text
      .slice(
        start,
        end
      )
      .trim();


  return `${
    start > 0
      ? "..."
      : ""
  }${snippet}${
    end < text.length
      ? "..."
      : ""
  }`;

}


// =========================================================
// NOTES PAGE
// =========================================================

export default function NotesPage() {

  // ======================================================
  // IMPORT INPUT
  // ======================================================

  const importFileRef =
    useRef(null);


  // ======================================================
  // NOTES STATE
  // ======================================================

  const [
    notes,
    setNotes,
  ] = useState(() => {

    const saved =
      localStorage.getItem(
        NOTES_STORAGE_KEY
      );


    if (!saved) {
      return [];
    }


    try {

      const parsed =
        JSON.parse(saved);


      if (
        !Array.isArray(
          parsed
        )
      ) {
        return [];
      }


      return parsed.map(
        (note) => ({

          ...note,

          date:
            normalizeNoteDate(
              note.date
            ),

          fontSize:
            Number(
              note.fontSize
            ) || 16,

          isPinned:
            Boolean(
              note.isPinned
            ),

          // Start notes collapsed when the app opens.
          isOpen: false,

        })
      );

    } catch (error) {

      console.error(
        "Could not load notes:",
        error
      );


      return [];

    }

  });


  // ======================================================
  // SEARCH
  // ======================================================

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  // ======================================================
  // THREE-DOT MENU
  // ======================================================

  const [
    openNoteMenuId,
    setOpenNoteMenuId,
  ] = useState(null);


  // ======================================================
  // SAVE NOTES
  // ======================================================

  useEffect(() => {

    localStorage.setItem(
      NOTES_STORAGE_KEY,
      JSON.stringify(notes)
    );

  }, [notes]);


  // ======================================================
  // SORT NOTES
  //
  // 1. Pinned first
  // 2. Newest date first
  // ======================================================

  const displayedNotes =
    useMemo(() => {

      return [
        ...notes,
      ].sort(
        (a, b) => {

          // ---------------------------------------------
          // PINNED FIRST
          // ---------------------------------------------

          const pinDifference =
            Number(
              Boolean(
                b.isPinned
              )
            ) -
            Number(
              Boolean(
                a.isPinned
              )
            );


          if (
            pinDifference !== 0
          ) {
            return pinDifference;
          }


          // ---------------------------------------------
          // NEWEST DATE FIRST
          // ---------------------------------------------

          const dateA =
            a.date || "";


          const dateB =
            b.date || "";


          return dateB.localeCompare(
            dateA
          );

        }
      );

    }, [notes]);


  // ======================================================
  // SEARCH RESULTS
  // ======================================================

  const searchResults =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      if (!query) {
        return [];
      }


      return displayedNotes.filter(
        (note) => {

          const searchableText = [

            note.title,

            note.date,

            formatNoteDate(
              note.date
            ),

            note.text,

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return searchableText.includes(
            query
          );

        }
      );

    }, [
      displayedNotes,
      searchQuery,
    ]);


  // ======================================================
  // ADD NOTE
  // ======================================================

  function addNote() {

    const newNote = {

      id:
        globalThis.crypto
          ?.randomUUID?.() ??
        `${Date.now()}-${Math.random()}`,

      title: "",

      date:
        getTodayDate(),

      text: "",

      isOpen: true,

      fontSize: 16,

      isPinned: false,

      createdAt:
        new Date().toISOString(),

    };


    setNotes(
      (currentNotes) => [

        newNote,

        // Close any currently open notes.
        ...currentNotes.map(
          (note) => ({
            ...note,
            isOpen: false,
          })
        ),

      ]
    );


    // If the user was searching,
    // return to normal notes view.
    setSearchQuery("");

  }


  // ======================================================
  // OPEN / CLOSE NOTE
  // ======================================================

  function toggleNote(
    noteId
  ) {

    setNotes(
      (currentNotes) =>
        currentNotes.map(
          (note) =>

            note.id === noteId
              ? {
                  ...note,

                  isOpen:
                    !note.isOpen,
                }
              : note

        )
    );

  }


  // ======================================================
  // OPEN SEARCH RESULT
  // ======================================================

  function openSearchResult(
    noteId
  ) {

    setNotes(
      (currentNotes) =>
        currentNotes.map(
          (note) => ({

            ...note,

            isOpen:
              note.id ===
              noteId,

          })
        )
    );


    setSearchQuery("");

  }


  // ======================================================
  // UPDATE NOTE
  // ======================================================

  function updateNote(
    noteId,
    field,
    value
  ) {

    setNotes(
      (currentNotes) =>
        currentNotes.map(
          (note) => {

            if (
              note.id !==
              noteId
            ) {
              return note;
            }


            return {

              ...note,

              [field]:
                value,

              updatedAt:
                new Date()
                  .toISOString(),

            };

          }
        )
    );

  }


  // ======================================================
  // PIN NOTE
  // ======================================================

  function togglePinNote(
    noteId
  ) {

    setNotes(
      (currentNotes) =>
        currentNotes.map(
          (note) =>

            note.id === noteId
              ? {
                  ...note,

                  isPinned:
                    !note.isPinned,
                }
              : note

        )
    );


    setOpenNoteMenuId(
      null
    );

  }


  // ======================================================
  // DELETE NOTE
  // ======================================================

  function deleteNote(
    noteId
  ) {

    const shouldDelete =
      window.confirm(
        "Delete this note? This cannot be undone."
      );


    if (!shouldDelete) {
      return;
    }


    setNotes(
      (currentNotes) =>
        currentNotes.filter(
          (note) =>
            note.id !== noteId
        )
    );


    setOpenNoteMenuId(
      null
    );

  }


  // ======================================================
  // CHANGE FONT SIZE
  // ======================================================

  function changeFontSize(
    noteId,
    amount
  ) {

    setNotes(
      (currentNotes) =>
        currentNotes.map(
          (note) => {

            if (
              note.id !==
              noteId
            ) {
              return note;
            }


            const currentSize =
              Number(
                note.fontSize
              ) || 16;


            const newSize =
              Math.min(
                28,
                Math.max(
                  12,
                  currentSize +
                    amount
                )
              );


            return {

              ...note,

              fontSize:
                newSize,

            };

          }
        )
    );

  }


  // ======================================================
  // EXPORT NOTES
  // ======================================================

  function exportNotes() {

    const backup = {

      app:
        "Expense Tracker Notes",

      version: 1,

      exportedAt:
        new Date()
          .toISOString(),

      notes,

    };


    const json =
      JSON.stringify(
        backup,
        null,
        2
      );


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


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      `expense-tracker-notes-${getTodayDate()}.json`;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      url
    );

  }


  // ======================================================
  // IMPORT NOTES
  // ======================================================

  function importNotes(
    event
  ) {

    const file =
      event.target
        .files?.[0];


    if (!file) {
      return;
    }


    if (
      !file.name
        .toLowerCase()
        .endsWith(".json")
    ) {

      window.alert(
        "Please choose a Notes JSON backup."
      );


      event.target.value =
        "";


      return;

    }


    const reader =
      new FileReader();


    reader.onload =
      () => {

        try {

          const backup =
            JSON.parse(
              reader.result
            );


          // ---------------------------------------------
          // VALIDATE
          // ---------------------------------------------

          if (
            backup.app !==
              "Expense Tracker Notes" ||
            backup.version !==
              1 ||
            !Array.isArray(
              backup.notes
            )
          ) {

            throw new Error(
              "Invalid notes backup."
            );

          }


          const shouldImport =
            window.confirm(
              `Import ${
                backup.notes.length
              } ${
                backup.notes.length === 1
                  ? "note"
                  : "notes"
              }?\n\n` +
              `This will replace your current ${
                notes.length
              } ${
                notes.length === 1
                  ? "note"
                  : "notes"
              }.`
            );


          if (!shouldImport) {

            event.target.value =
              "";

            return;

          }


          const importedNotes =
            backup.notes.map(
              (note) => ({

                id:
                  note.id ??
                  `${Date.now()}-${Math.random()}`,

                title:
                  typeof note.title ===
                  "string"
                    ? note.title
                    : "",

                date:
                  normalizeNoteDate(
                    note.date
                  ),

                text:
                  typeof note.text ===
                  "string"
                    ? note.text
                    : "",

                fontSize:
                  Number(
                    note.fontSize
                  ) || 16,

                isPinned:
                  Boolean(
                    note.isPinned
                  ),

                // Imported notes begin collapsed.
                isOpen: false,

                createdAt:
                  note.createdAt ||
                  new Date()
                    .toISOString(),

                updatedAt:
                  note.updatedAt,

              })
            );


          setNotes(
            importedNotes
          );


          setOpenNoteMenuId(
            null
          );


          setSearchQuery(
            ""
          );


          window.alert(
            "Notes imported successfully."
          );

        } catch (error) {

          console.error(
            "Could not import notes:",
            error
          );


          window.alert(
            "That file could not be imported. Make sure it is a valid Expense Tracker Notes backup."
          );

        }


        // Allows choosing the same file again later.
        event.target.value =
          "";

      };


    reader.readAsText(
      file
    );

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <main className="app-shell notes-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="notes-page-header">

        <div>

          <div className="app-eyebrow">
            Expense Tracker
          </div>

          <h1>
            Notes
          </h1>

        </div>


        <div className="notes-count">

          {notes.length}{" "}

          {notes.length === 1
            ? "note"
            : "notes"}

        </div>

      </header>


      {/* =================================================
          SEARCH + IMPORT / EXPORT
      ================================================= */}

      <section className="notes-tools-row">

        {/* SEARCH */}

        <div className="notes-search">

          <div className="notes-search-input-wrap">

            <svg
              className="notes-search-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <circle
                cx="11"
                cy="11"
                r="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />

              <path
                d="M16.5 16.5L21 21"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

            </svg>


            <input
              className="notes-search-input"
              type="search"
              placeholder="Search all notes..."
              value={
                searchQuery
              }
              onChange={(
                event
              ) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />


            {searchQuery && (

              <button
                type="button"
                className="notes-search-clear"
                onClick={() =>
                  setSearchQuery(
                    ""
                  )
                }
                aria-label="Clear search"
              >
                ×
              </button>

            )}

          </div>

        </div>


        {/* BACKUP BUTTONS */}

        <div className="notes-backup-actions">

          {/* IMPORT */}

          <button
            type="button"
            className="notes-tool-button"
            onClick={() =>
              importFileRef.current
                ?.click()
            }
            aria-label="Import notes"
            title="Import notes"
          >

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                d="M12 3v12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="m7 10 5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M5 20h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

            </svg>

          </button>


          {/* EXPORT */}

          <button
            type="button"
            className="notes-tool-button"
            onClick={
              exportNotes
            }
            aria-label="Export notes"
            title="Export notes"
          >

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                d="M12 21V9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="m7 14 5-5 5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M5 4h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

            </svg>

          </button>

        </div>


        {/* HIDDEN IMPORT INPUT */}

        <input
          ref={
            importFileRef
          }
          type="file"
          accept=".json,application/json"
          onChange={
            importNotes
          }
          className="backup-file-input"
        />

      </section>


      {/* =================================================
          SEARCH RESULTS
      ================================================= */}

      {searchQuery.trim() ? (

        <section className="notes-search-results">

          <div className="notes-search-results-header">

            {searchResults.length}{" "}

            {searchResults.length === 1
              ? "result"
              : "results"}

          </div>


          {searchResults.length === 0 && (

            <div className="notes-search-empty">

              <h2>
                No notes found
              </h2>

              <p>
                Try another word or phrase.
              </p>

            </div>

          )}


          {searchResults.map(
            (note) => (

              <button
                type="button"
                className="notes-search-result"
                key={
                  note.id
                }
                onClick={() =>
                  openSearchResult(
                    note.id
                  )
                }
              >

                <div className="notes-search-result-top">

                  <div>

                    <h2>
                      {note.title ||
                        "New Note"}
                    </h2>

                    <p>
                      {formatNoteDate(
                        note.date
                      )}
                    </p>

                  </div>


                  <span>
                    ›
                  </span>

                </div>


                {note.text && (

                  <p className="notes-search-preview">

                    {getSearchSnippet(
                      note.text,
                      searchQuery
                    )}

                  </p>

                )}

              </button>

            )
          )}

        </section>

      ) : (

        <>
          {/* ===============================================
              NOTES HEADING
          =============================================== */}

          <div className="notes-top-row">

            <div className="notes-section-heading">

              <h2>
                Your notes
              </h2>

            </div>


            <button
              type="button"
              className="add-note-button"
              onClick={
                addNote
              }
            >
              + New Note
            </button>

          </div>


          {/* ===============================================
              EMPTY STATE
          =============================================== */}

          {notes.length === 0 && (

            <div className="empty-notes">

              <div className="empty-notes-icon">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >

                  <path
                    d="M6 3h9l3 3v15H6V3Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M9 11h6M9 15h6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                </svg>

              </div>


              <h2>
                No notes yet
              </h2>

              <p>
                Keep reminders, spending ideas,
                financial goals, or anything else
                you want to remember.
              </p>


              <button
                type="button"
                onClick={
                  addNote
                }
              >
                + Create Note
              </button>

            </div>

          )}


          {/* ===============================================
              NOTES
          =============================================== */}

          <section className="notes-stack">

            {displayedNotes.map(
              (note) => (

                <article
                  key={
                    note.id
                  }
                  className={
                    note.isOpen
                      ? "note-card note-card-open"
                      : "note-card"
                  }
                >

                  {/* =======================================
                      HEADER
                  ======================================= */}

                  <div className="note-card-header">

                    <button
                      type="button"
                      className="note-header-main"
                      onClick={() =>
                        toggleNote(
                          note.id
                        )
                      }
                    >

                      <div className="note-header-text">

                        <div className="note-title-row">

                          <h2>
                            {note.title ||
                              "New Note"}
                          </h2>


                          {/* BOOKMARK / PIN */}

                          {note.isPinned && (

                            <span
                              className="note-pinned-icon"
                              title="Pinned note"
                              aria-label="Pinned note"
                            >

                              <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >

                                <path
                                  d="M6 4.75A2.75 2.75 0 0 1 8.75 2h6.5A2.75 2.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z"
                                  fill="currentColor"
                                />

                              </svg>

                            </span>

                          )}

                        </div>


                        <p>
                          {formatNoteDate(
                            note.date
                          )}
                        </p>

                      </div>

                    </button>


                    {/* =====================================
                        THREE-DOT MENU
                    ===================================== */}

                    <div className="note-menu-container">

                      <button
                        type="button"
                        className="note-menu-button"
                        onClick={(
                          event
                        ) => {

                          event.stopPropagation();


                          setOpenNoteMenuId(
                            (
                              currentId
                            ) =>
                              currentId ===
                              note.id
                                ? null
                                : note.id
                          );

                        }}
                        aria-label="Note options"
                      >
                        ⋯
                      </button>


                      {openNoteMenuId ===
                        note.id && (

                        <div
                          className="note-menu-dropdown"
                          onClick={(
                            event
                          ) =>
                            event.stopPropagation()
                          }
                        >

                          <button
                            type="button"
                            className="note-menu-item"
                            onClick={() =>
                              togglePinNote(
                                note.id
                              )
                            }
                          >

                            {note.isPinned
                              ? "Unpin"
                              : "Pin"}

                          </button>


                          <button
                            type="button"
                            className="note-menu-item note-menu-delete"
                            onClick={() =>
                              deleteNote(
                                note.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      )}

                    </div>

                  </div>


                  {/* =======================================
                      EXPANDED NOTE
                  ======================================= */}

                  {note.isOpen && (

                    <div className="note-card-body">

                      <div className="note-editor-fields">

                        {/* TITLE */}

                        <input
                          className="note-title-input"
                          value={
                            note.title
                          }
                          onChange={(
                            event
                          ) =>
                            updateNote(
                              note.id,
                              "title",
                              event.target
                                .value
                            )
                          }
                          placeholder="Note title"
                        />


                        {/* DATE + FONT SIZE */}

                        <div className="date-font-row">

                          <input
                            className="note-date-input"
                            type="date"
                            value={
                              note.date
                            }
                            onChange={(
                              event
                            ) =>
                              updateNote(
                                note.id,
                                "date",
                                event.target
                                  .value
                              )
                            }
                          />


                          <div className="inline-font-controls">

                            <button
                              type="button"
                              onClick={() =>
                                changeFontSize(
                                  note.id,
                                  -1
                                )
                              }
                              aria-label="Decrease text size"
                            >
                              A−
                            </button>


                            <span>
                              {note.fontSize}
                            </span>


                            <button
                              type="button"
                              onClick={() =>
                                changeFontSize(
                                  note.id,
                                  1
                                )
                              }
                              aria-label="Increase text size"
                            >
                              A+
                            </button>

                          </div>

                        </div>


                        {/* BODY */}

                        <textarea
                          className="note-textarea"
                          placeholder="Write your note..."
                          value={
                            note.text
                          }
                          onChange={(
                            event
                          ) =>
                            updateNote(
                              note.id,
                              "text",
                              event.target
                                .value
                            )
                          }
                          style={{
                            fontSize:
                              `${note.fontSize}px`,
                          }}
                        />

                      </div>

                    </div>

                  )}

                </article>

              )
            )}

          </section>

        </>

      )}

    </main>

  );

}