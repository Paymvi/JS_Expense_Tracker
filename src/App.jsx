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




import "./App.css";

import AddExpenseModal from "./components/AddExpenseModal";
import BottomNav from "./components/BottomNav";

import OverviewPage from "./pages/OverviewPage";
import TransactionsPage from "./pages/TransactionsPage";
import NotesPage from "./pages/NotesPage";
import VisualizerPage from "./pages/VisualizerPage";
import Pools from "./pages/Pools";


const STORAGE_KEY =
  "expense-tracker-expenses-v1";

const COVERED_FILTER_STORAGE_KEY =
  "expense-tracker-include-covered-v1";


function App() {

  const location =
    useLocation();


  const shouldHideAddButton =
    location.pathname === "/notes" ||
    location.pathname === "/visualizer";

  // ======================================================
  // EXPENSE DATA
  // ======================================================

  const [
    expenses,
    setExpenses,
  ] = useState(() => {

    try {

      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );


      if (!saved) {
        return [];
      }


      const parsed =
        JSON.parse(saved);


      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch (error) {

      console.error(
        "Could not load expenses:",
        error
      );


      return [];

    }

  });


  // ======================================================
  // COVERED EXPENSE FILTER
  // ======================================================

  const [
    includeCovered,
    setIncludeCovered,
  ] = useState(() => {

    try {

      return (
        localStorage.getItem(
          COVERED_FILTER_STORAGE_KEY
        ) === "true"
      );

    } catch (error) {

      console.error(
        "Could not load covered filter:",
        error
      );

      return false;

    }

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
  // SAVE EXPENSES
  // ======================================================

  useEffect(() => {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(expenses)
    );

  }, [expenses]);


  // ======================================================
  // SAVE COVERED FILTER PREFERENCE
  // ======================================================

  useEffect(() => {

    localStorage.setItem(
      COVERED_FILTER_STORAGE_KEY,
      String(includeCovered)
    );

  }, [includeCovered]);


  // ======================================================
  // ADD EXPENSE
  // ======================================================

  function addExpense(
    expense
  ) {

    const id =
      globalThis.crypto
        ?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;


    const newExpense = {

      id,

      ...expense,

      createdAt:
        new Date().toISOString(),

    };


    setExpenses(
      (previous) => [
        newExpense,
        ...previous,
      ]
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

    setExpenses(
      (previousExpenses) => {

        return previousExpenses.map(
          (expense) => {

            // Not the transaction we're editing?
            // Leave it exactly as it is.
            if (
              expense.id !==
              expenseId
            ) {
              return expense;
            }


            // Found it.
            // Keep the old information,
            // then overwrite the changed fields.
            return {

              ...expense,

              ...changes,

              updatedAt:
                new Date().toISOString(),

            };

          }
        );

      }
    );
  }

  function deleteExpense(
    expenseId
  ) {

    setExpenses(
      (previousExpenses) => {

        return previousExpenses.filter(
          (expense) =>
            expense.id !==
            expenseId
        );

      }
    );
  }

  // ======================================================
  // EXPORT BACKUP
  // ======================================================

  function exportExpenses() {

    downloadExpenseBackup(
      expenses
    );

  }

  // ======================================================
  // IMPORT BACKUP
  // ======================================================

  async function importExpenses(
    file
  ) {

    try {

      // Read + validate the file.
      const importedExpenses =
        await readExpenseBackup(
          file
        );


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

      setExpenses(
        importedExpenses
      );


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
