// =========================================================
// SAVE A TEXT FILE
//
// Browser: normal file download (same as before).
//
// Native app: WebViews ignore <a download>, so instead we
// write the file to the phone's Documents/ExpenseTracker
// folder and open the share sheet, where it can be sent to
// Drive, email, Files, another device, etc.
// =========================================================

import { isNativeApp } from "../data/storage";


const NATIVE_FOLDER =
  "ExpenseTracker";


function downloadInBrowser(
  fileName,
  text,
  mimeType
) {

  const blob =
    new Blob(
      [text],
      {
        type: mimeType,
      }
    );


  const url =
    URL.createObjectURL(blob);


  // Create a temporary download link.
  const link =
    document.createElement("a");

  link.href = url;

  link.download = fileName;

  document.body.appendChild(link);


  // Trigger the browser download.
  link.click();


  // Clean everything up.
  link.remove();

  URL.revokeObjectURL(url);

}


async function saveOnDevice(
  fileName,
  text
) {

  const {
    Directory,
    Encoding,
    Filesystem,
  } = await import("@capacitor/filesystem");


  const path =
    `${NATIVE_FOLDER}/${fileName}`;


  let saved;

  let savedToDocuments = true;


  try {

    saved =
      await Filesystem.writeFile({
        path,
        data: text,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });

  } catch (error) {

    // Some devices / Android versions don't allow writing
    // to Documents. Fall back to the app's cache so the
    // share sheet still works.
    console.warn(
      "Could not write to Documents, using cache instead:",
      error
    );

    savedToDocuments = false;

    saved =
      await Filesystem.writeFile({
        path,
        data: text,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });

  }


  try {

    const { Share } =
      await import("@capacitor/share");

    await Share.share({
      title: fileName,
      files: [saved.uri],
    });

  } catch (error) {

    // Closing the share sheet without picking anything
    // also lands here. The file is still saved.
    console.info(
      "Share sheet closed:",
      error
    );

  }


  if (savedToDocuments) {

    window.alert(
      `Saved to Documents/${path}`
    );

  } else {

    window.alert(
      "This file could not be saved to Documents. " +
      "If you closed the share sheet, export again and send it somewhere safe."
    );

  }

}


export async function saveTextFile(
  fileName,
  text,
  mimeType = "application/json"
) {

  if (isNativeApp()) {

    await saveOnDevice(
      fileName,
      text
    );

    return;

  }


  downloadInBrowser(
    fileName,
    text,
    mimeType
  );

}
