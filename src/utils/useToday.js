// =========================================================
// TODAY (local calendar day, "YYYY-MM-DD")
//
// Screens that show "this month" / "this week" use this so
// they move to the new day when the app stays open past
// midnight, or comes back after being suspended.
//
// One timer to the next local midnight, plus a re-check when
// the tab becomes visible or the Android app resumes (timers
// are paused while the app is in the background). Setting
// the same string again does not re-render.
// =========================================================

import {
  useEffect,
  useState,
} from "react";

import { isNativeApp } from "../data/storage.js";

import { toDateInputValue } from "./expenseHelpers.js";


export function useToday() {

  const [today, setToday] =
    useState(() => toDateInputValue());


  useEffect(() => {

    let timer = null;

    let removeResumeListener = null;

    let stopped = false;


    function scheduleNextMidnight() {

      clearTimeout(timer);

      const now = new Date();

      const nextMidnight =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1
        );

      // +1s so we are safely past midnight when it fires.
      timer =
        setTimeout(
          check,
          nextMidnight - now + 1000
        );

    }


    function check() {

      setToday(toDateInputValue());

      scheduleNextMidnight();

    }


    function onVisibilityChange() {

      if (document.visibilityState === "visible") {
        check();
      }

    }


    scheduleNextMidnight();

    document.addEventListener("visibilitychange", onVisibilityChange);

    window.addEventListener("focus", check);


    // Same @capacitor/app plugin the back button uses.
    if (isNativeApp()) {

      import("@capacitor/app")
        .then(({ App }) => App.addListener("resume", check))
        .then((handle) => {

          if (stopped) {
            handle.remove();
          } else {
            removeResumeListener = () => handle.remove();
          }

        })
        .catch((error) => {
          console.warn("Could not listen for app resume:", error);
        });

    }


    return () => {

      stopped = true;

      clearTimeout(timer);

      document.removeEventListener("visibilitychange", onVisibilityChange);

      window.removeEventListener("focus", check);

      removeResumeListener?.();

    };

  }, []);


  return today;

}
