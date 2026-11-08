import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";

import App from "./App.jsx";

import {
  initStorage,
  isNativeApp,
} from "./data/storage";


if (isNativeApp()) {

  import("./native/backButton").then(
    ({ setUpBackButton }) => setUpBackButton()
  );

}


const root =
  createRoot(document.getElementById("root"));


// Load saved data from the device BEFORE showing the app,
// so no screen ever renders with empty data by mistake.
initStorage()
  .then(() => {

    root.render(
      <StrictMode>

        <BrowserRouter>

          <App />

        </BrowserRouter>

      </StrictMode>
    );

  })
  .catch((error) => {

    console.error(
      "Could not open saved data:",
      error
    );


    // Don't start the app with an empty data set: that
    // could look like everything was lost. Nothing on the
    // device has been changed at this point.
    root.render(
      <div className="startup-error">

        <h1>Couldn't open your data</h1>

        <p>
          Your saved expenses were not changed. Please close
          the app completely and open it again.
        </p>

        <pre>{String(error?.message || error)}</pre>

      </div>
    );

  });
