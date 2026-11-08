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
  downloadExpenseBackup,
  readExpenseBackup,
} from "./utils/backupHelpers";

import {
  addExpense as saveNewExpense,
  deleteExpense as removeExpense,
  replaceExpenses,
  updateExpense as saveExpenseChanges,
  useExpenses,
} from "./data/expenseRepository";

import {
  getNotes,
  saveNotes,
} from "./data/notesRepository";

import {
  getPools,
  savePools,
} from "./data/poolsRepository";

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


  const overviewExpenses =
    includeCovered
      ? expenses
      : expenses.filter(
          (expense) =>
            expense.covered !== true
        );


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
  // ADD EXPENSE
  // ======================================================

  function addExpense(
    expense
  ) {

    // The repository creates the id and createdAt,
    // then saves it to the device.
    saveNewExpense(
      expense
    );

  }

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


  function updateExpense(
    expenseId,
    changes
  ) {

    saveExpenseChanges(
      expenseId,
      changes
    );
  }

  function deleteExpense(
    expenseId
  ) {

    removeExpense(
      expenseId
    );
  }

  // ======================================================
  // EXPORT BACKUP
  // ======================================================

  async function exportExpenses() {

    try {

      await downloadExpenseBackup({
        expenses,
        notes: getNotes(),
        pools: getPools(),
      });

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

      // Read + validate the file.
      const backup =
        await readExpenseBackup(
          file
        );

      const importedExpenses =
        backup.expenses;


      // --------------------------------------------------
      // CONFIRM BEFORE REPLACING DATA
      // --------------------------------------------------

      const shouldImport =
        window.confirm(
          `This backup contains ${
            importedExpenses.length
          } ${
            importedExpenses.length === 1
              ? "transaction"
              : "transactions"
          }.\n\n` +
          `Importing it will replace your current ${
            expenses.length
          } ${
            expenses.length === 1
              ? "transaction"
              : "transactions"
          }.\n\n` +
          "Continue?"
        );


      if (!shouldImport) {
        return;
      }


      // --------------------------------------------------
      // REPLACE CURRENT EXPENSES
      // --------------------------------------------------

      replaceExpenses(
        importedExpenses
      );


      // --------------------------------------------------
      // NOTES + POOLS (only in newer backups)
      //
      // Asked separately so nothing is replaced
      // without a clear yes.
      // --------------------------------------------------

      const restored = [];

      if (
        backup.notes &&
        window.confirm(
          `This backup also contains ${backup.notes.length} ${
            backup.notes.length === 1 ? "note" : "notes"
          }.

` +
          `Replace your current ${getNotes().length} ${
            getNotes().length === 1 ? "note" : "notes"
          } with them?`
        )
      ) {

        saveNotes(
          backup.notes
        );

        restored.push(
          `${backup.notes.length} ${
            backup.notes.length === 1 ? "note" : "notes"
          }`
        );

      }


      if (
        backup.pools &&
        window.confirm(
          `This backup also contains ${backup.pools.length} ${
            backup.pools.length === 1 ? "pool" : "pools"
          }.

` +
          `Replace your current ${getPools().length} ${
            getPools().length === 1 ? "pool" : "pools"
          } with them?`
        )
      ) {

        savePools(
          backup.pools
        );

        restored.push(
          `${backup.pools.length} ${
            backup.pools.length === 1 ? "pool" : "pools"
          }`
        );

      }


      // Make sure no old transaction is still being
      // edited after changing the entire data set.
      setEditingExpense(
        null
      );


      setIsAddModalOpen(
        false
      );


      window.alert(
        `Imported ${
          importedExpenses.length
        } ${
          importedExpenses.length === 1
            ? "transaction"
            : "transactions"
        }${
          restored.length > 0
            ? ` and ${restored.join(" and ")}`
            : ""
        }.`
      );

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

              </div>


              <OverviewPage
                expenses={
                  overviewExpenses
                }
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
              expenses={expenses}
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
          addExpense
        }

        editingExpense={
          editingExpense
        }

        onUpdateExpense={
          updateExpense
        }

        onDeleteExpense={
          deleteExpense
        }
      />

    </div>

  );

}


export default App;
