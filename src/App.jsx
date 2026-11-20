import {
  useEffect,
  useState,
} from "react";

import {
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  createBackupJson,
  InvalidBackupDatesError,
  readExpenseBackup,
} from "./utils/backupHelpers";

import {
  getSpendingExpenses,
  toDateInputValue,
} from "./utils/expenseHelpers";

import { saveTextFile } from "./utils/saveFile";

import { useToday } from "./utils/useToday";

import {
  addExpense as saveNewExpense,
  deleteExpense as removeExpense,
  updateExpense as saveExpenseChanges,
  useExpenses,
} from "./data/expenseRepository";

import { getNotes } from "./data/notesRepository";

import { getPools } from "./data/poolsRepository";

import { restoreBackup } from "./data/restoreBackup";

import {
  getSetting,
  setSetting,
} from "./data/storage";


import "./App.css";

import AddExpenseModal from "./components/AddExpenseModal";
import BottomNav from "./components/BottomNav";

import OverviewPage from "./pages/OverviewPage";
import TransactionsPage from "./pages/TransactionsPage";
import NotesPage from "./pages/NotesPage";
import VisualizerPage from "./pages/VisualizerPage";
import Pools from "./pages/Pools";


function App() {

  const location =
    useLocation();


  const shouldHideAddButton =
    location.pathname === "/notes" ||
    location.pathname === "/visualizer";

  // ======================================================
  // EXPENSE DATA
  // ======================================================

  // Loaded from the device database before the app
  // renders. Re-renders whenever expenses change.
  const expenses =
    useExpenses();


  // ======================================================
  // COVERED EXPENSE FILTER
  // ======================================================

  const [
    includeCovered,
    setIncludeCovered,
  ] = useState(() => {

    return (
      getSetting(
        "includeCovered"
      ) === "true"
    );

  });


  // What counts toward spending totals on every page.
  // Transactions still lists all expenses for browsing.
  const spendingExpenses =
    getSpendingExpenses(
      expenses,
      includeCovered
    );


  // ======================================================
  // NIGHT MODE
  // ======================================================

  const [
    nightMode,
    setNightMode,
  ] = useState(() => {

    return (
      getSetting(
        "nightMode"
      ) === "true"
    );

  });


  useEffect(() => {

    document.documentElement.classList.toggle(
      "night-mode",
      nightMode
    );

    setSetting(
      "nightMode",
      nightMode
    );

  }, [nightMode]);


  // Local calendar day; changes at midnight / on resume.
  const today =
    useToday();


  const coveredExpenseCount =
    expenses.filter(
      (expense) =>
        expense.covered === true
    ).length;


  // ======================================================
  // ADD MODAL
  // ======================================================

  const [
    isAddModalOpen,
    setIsAddModalOpen,
  ] = useState(false);

  const [
    editingExpense,
    setEditingExpense,
  ] = useState(null);


  // ======================================================
  // SAVE COVERED FILTER PREFERENCE
  // ======================================================

  useEffect(() => {

    setSetting(
      "includeCovered",
      includeCovered
    );

  }, [includeCovered]);


  // ======================================================
  // ADD / EDIT MODAL
  // ======================================================

  function openAddExpense() {

    // Make absolutely sure we're not
    // carrying over an expense from edit mode.
    setEditingExpense(null);

    setIsAddModalOpen(true);
  }

  function openEditExpense(
    expense
  ) {

    setEditingExpense(
      expense
    );

    setIsAddModalOpen(
      true
    );
  }

  function closeExpenseModal() {

    setIsAddModalOpen(false);

    setEditingExpense(null);
  }

  // ======================================================
  // EXPORT BACKUP
  // ======================================================

  async function exportExpenses() {

    try {

      const json =
        createBackupJson({
          expenses,
          notes: getNotes(),
          pools: getPools(),
        });


      // Read our own file back with the import rules, so a
      // problem shows up now and not on the day of a restore.
      try {

        await readExpenseBackup({
          text: async () => json,
        });

      } catch (problem) {

        const exportAnyway =
          window.confirm(
            "This backup would not import cleanly:\n\n" +
            `${problem.message}\n\n` +
            (problem instanceof InvalidBackupDatesError
              ? "Fix them under \"Needs a date\" in Transactions. If you export now, importing will ask before keeping them.\n\n"
              : "") +
            "Export anyway?"
          );

        if (!exportAnyway) {
          return;
        }

      }


      await saveTextFile(
        `expense-tracker-backup-${toDateInputValue()}.json`,
        json
      );

    } catch (error) {

      console.error(
        "Could not export backup:",
        error
      );


      window.alert(
        "Could not export this backup."
      );

    }

  }

  // ======================================================
  // IMPORT BACKUP
  // ======================================================

  async function importExpenses(
    file
  ) {

    try {

      // Validates everything and asks every question
      // before anything is written.
      const summary =
        await restoreBackup(
          file,
          { confirm: (message) => window.confirm(message) }
        );

      if (summary === null) {
        return;
      }


      // Make sure no old transaction is still being
      // edited after changing the entire data set.
      closeExpenseModal();

      window.alert(summary);

    } catch (error) {

      console.error(
        "Could not import backup:",
        error
      );

      window.alert(
        error.message ||
        "Could not import this backup."
      );

    }

  }

  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="app">

      {/* PAGES */}

      <Routes>

        <Route
          path="/"
          element={
            <div className="overview-route">

              {/* =========================================
                  COVERED EXPENSE FILTER
              ========================================= */}

              <div className="covered-filter-shell">

                <div className="covered-filter-control">

                  <div className="covered-filter-copy">

                    <div className="covered-filter-title">
                      Include covered
                    </div>

                    <div className="covered-filter-description">

                      {coveredExpenseCount === 0
                        ? "No covered expenses yet"
                        : includeCovered
                        ? `${coveredExpenseCount} covered ${
                            coveredExpenseCount === 1
                              ? "expense is"
                              : "expenses are"
                          } included`
                        : `${coveredExpenseCount} covered ${
                            coveredExpenseCount === 1
                              ? "expense is"
                              : "expenses are"
                          } excluded`}

                    </div>

                  </div>


                  <button
                    type="button"
                    className={`covered-switch ${
                      includeCovered
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {

                      setIncludeCovered(
                        (previous) =>
                          !previous
                      );

                    }}
                    aria-label="Include covered expenses in overview totals"
                    aria-pressed={
                      includeCovered
                    }
                  >

                    <span className="covered-switch-knob" />

                  </button>

                </div>


                <div className="covered-filter-control night-mode-control">

                  <div className="covered-filter-copy">

                    <div className="covered-filter-title">
                      Night mode
                    </div>

                    <div className="covered-filter-description">
                      {nightMode ? "Dark colors" : "Light colors"}
                    </div>

                  </div>


                  <button
                    type="button"
                    className={`covered-switch ${
                      nightMode
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {

                      setNightMode(
                        (previous) =>
                          !previous
                      );

                    }}
                    aria-label="Night mode"
                    aria-pressed={
                      nightMode
                    }
                  >

                    <span className="covered-switch-knob" />

                  </button>

                </div>

              </div>


              <OverviewPage
                expenses={
                  spendingExpenses
                }
                today={today}
              />

            </div>
          }
        />


        <Route
          path="/transactions"
          element={
            <TransactionsPage
              expenses={
                expenses
              }

              spendingExpenses={
                spendingExpenses
              }

              includeCovered={
                includeCovered
              }

              today={today}

              onEditExpense={
                openEditExpense
              }

              onExportExpenses={
                exportExpenses
              }

              onImportExpenses={
                importExpenses
              }
            />
          }
        />

        <Route
          path="/visualizer"
          element={
            <VisualizerPage
              expenses={spendingExpenses}
              includeCovered={includeCovered}
              today={today}
            />
          }
        />

        <Route path="/pools" element={<Pools />} />


        <Route
          path="/notes"
          element={
            <NotesPage />
          }
        />

      </Routes>


      {/* ADD EXPENSE BUTTON */}

      {!shouldHideAddButton && (

        <button
          type="button"
          className="floating-add-button"
          onClick={
            openAddExpense
          }
          aria-label="Add expense"
        >
          +
        </button>

      )}


      {/* BOTTOM NAVIGATION */}

      <BottomNav />


      {/* ADD EXPENSE MODAL */}

      <AddExpenseModal
        isOpen={
          isAddModalOpen
        }

        onClose={
          closeExpenseModal
        }

        onAddExpense={
          saveNewExpense
        }

        editingExpense={
          editingExpense
        }

        onUpdateExpense={
          saveExpenseChanges
        }

        onDeleteExpense={
          removeExpense
        }
      />

    </div>

  );

}


export default App;
