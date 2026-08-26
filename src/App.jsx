import {
  useEffect,
  useState,
} from "react";

import {
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

import AddExpenseModal from "./components/AddExpenseModal";
import BottomNav from "./components/BottomNav";

import OverviewPage from "./pages/OverviewPage";
import TransactionsPage from "./pages/TransactionsPage";


const STORAGE_KEY =
  "expense-tracker-expenses-v1";


function App() {

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
  // UI
  // ======================================================

  return (

    <div className="app">

      {/* PAGES */}

      <Routes>

        <Route
          path="/"
          element={
            <OverviewPage
              expenses={expenses}
            />
          }
        />


        <Route
          path="/transactions"
          element={
            <TransactionsPage
              expenses={expenses}
              onEditExpense={
                openEditExpense
              }
            />
          }
        />

      </Routes>


      {/* ADD EXPENSE BUTTON */}

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