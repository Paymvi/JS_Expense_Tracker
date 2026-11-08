import {
  useRef,
} from "react";


export default function ImportExportControls({
  onExport,
  onImport,
}) {

  const fileInputRef =
    useRef(null);


  // ======================================================
  // OPEN FILE PICKER
  // ======================================================

  function openImportPicker() {

    fileInputRef.current?.click();

  }


  // ======================================================
  // USER SELECTED A FILE
  // ======================================================

  async function handleFileChange(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    await onImport(
      file
    );


    // Clear the file input afterward.
    //
    // This is important because otherwise selecting
    // the SAME backup again may not trigger onChange.
    event.target.value =
      "";

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="import-export-controls">

      {/* IMPORT */}

      <button
        type="button"
        className="data-control-button"
        aria-label="Import backup"
        title="Import backup"
        onClick={
          openImportPicker
        }
      >

        {/* Arrow down into a tray */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        </svg>

      </button>


      {/* EXPORT */}

      <button
        type="button"
        className="data-control-button"
        aria-label="Export backup"
        title="Export backup"
        onClick={
          onExport
        }
      >

        {/* Arrow up out of a tray */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 15V3" />
          <path d="m7 8 5-5 5 5" />
          <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        </svg>

      </button>


      {/* HIDDEN FILE INPUT */}

      <input
        ref={
          fileInputRef
        }
        className="backup-file-input"
        type="file"
        accept=".json,application/json"
        onChange={
          handleFileChange
        }
      />

    </div>

  );

}