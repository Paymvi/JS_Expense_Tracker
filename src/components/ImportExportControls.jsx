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
        onClick={
          openImportPicker
        }
      >
        Import backup
      </button>


      {/* EXPORT */}

      <button
        type="button"
        className="data-control-button"
        onClick={
          onExport
        }
      >
        Export backup
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