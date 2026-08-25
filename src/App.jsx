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
            />
          }
        />

      </Routes>


      {/* ADD EXPENSE BUTTON */}

      <button
        type="button"
        className="floating-add-button"
        onClick={() => {

          setIsAddModalOpen(
            true
          );

        }}
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
        onClose={() => {

          setIsAddModalOpen(
            false
          );

        }}
        onAddExpense={
          addExpense
        }
      />

    </div>

  );

}


export default App;