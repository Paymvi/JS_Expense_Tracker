// =========================================================
// ANDROID BACK BUTTON
//
// Without this, Android's back button closes the whole app.
//
// 1. If a modal is open, close it (same as tapping the dark
//    background around it).
// 2. Otherwise go back to the previous page.
// 3. On the first page, leave the app like any other app.
// =========================================================

import { App } from "@capacitor/app";


const BACKDROP_SELECTOR =
  ".modal-backdrop, .pools-modal-backdrop";


export function setUpBackButton() {

  App.addListener(
    "backButton",
    ({ canGoBack }) => {

      const backdrops =
        document.querySelectorAll(BACKDROP_SELECTOR);

      const topBackdrop =
        backdrops[backdrops.length - 1];


      if (topBackdrop) {

        topBackdrop.dispatchEvent(
          new MouseEvent(
            "mousedown",
            { bubbles: true }
          )
        );

        return;

      }


      // React Router stores how deep we are in its own
      // history entries ("idx"). That is more reliable
      // than the WebView's canGoBack for in-app pages.
      const routerIndex =
        window.history.state?.idx ?? 0;


      if (routerIndex > 0 || canGoBack) {

        window.history.back();

        return;

      }


      App.exitApp();

    }
  );

}
