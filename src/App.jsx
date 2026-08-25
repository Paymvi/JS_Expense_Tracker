import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./App.css";

import MonthlySnapshot from "./components/MonthlySnapshot";
import WeeklySpending from "./components/WeeklySpending";
import AddExpenseModal from "./components/AddExpenseModal";

import {
  buildMonthlySnapshot,
  buildWeeklySpending,
  formatCurrency,
  getCurrentMonthCount,
  getCurrentMonthTotal,
} from "./utils/expenseHelpers";


const STORAGE_KEY =
  "expense-tracker-expenses-v1";


function App() {

  // ======================================================
  // EXPENSE DATA
  // ======================================================

  const [expenses, setExpenses] =
    useState(() => {

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
  // UI STATE
  // ======================================================

  const [
    isAddModalOpen,
    setIsAddModalOpen,
  ] = useState(false);


  const [
    showTrends,
    setShowTrends,
  ] = useState(true);


  const [
    selectedWeekIndex,
    setSelectedWeekIndex,
  ] = useState(11);


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
  // CALCULATED DATA
  // ======================================================

  const currentMonthTotal =
    useMemo(() => {

      return getCurrentMonthTotal(
        expenses
      );

    }, [expenses]);


  const currentMonthCount =
    useMemo(() => {

      return getCurrentMonthCount(
        expenses
      );

    }, [expenses]);


  const monthlySnapshot =
    useMemo(() => {

      return buildMonthlySnapshot(
        expenses,
        3
      );

    }, [expenses]);


  const weeks =
    useMemo(() => {

      return buildWeeklySpending(
        expenses,
        12
      );

    }, [expenses]);


  // Always start on the newest week.
  useEffect(() => {

    if (weeks.length > 0) {

      setSelectedWeekIndex(
        weeks.length - 1
      );

    }

  }, [weeks.length]);


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


    // Newest expense goes first.
    setExpenses(
      (previous) => [
        newExpense,
        ...previous,
      ]
    );
  }


  // ======================================================
  // CURRENT MONTH LABEL
  // ======================================================

  const currentMonthLabel =
    new Date().toLocaleString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );


  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="app">

      <main className="app-shell">


        {/* HEADER */}

        <header className="app-header">

          <div>

            <div className="app-eyebrow">
              Expense Tracker
            </div>

            <h1>
              Overview
            </h1>

          </div>

        </header>


        {/* THIS MONTH HERO */}

        <section className="monthly-total-card">

          <div className="monthly-total-label">
            Spent this month
          </div>


          <div className="monthly-total">

            {formatCurrency(
              currentMonthTotal
            )}

          </div>


          <div className="monthly-total-footer">

            <span>
              {currentMonthLabel}
            </span>

            <span>
              {currentMonthCount}{" "}
              {currentMonthCount === 1
                ? "transaction"
                : "transactions"}
            </span>

          </div>

        </section>


        {/* MONTHLY SNAPSHOTS */}

        <MonthlySnapshot
          monthlySnapshot={
            monthlySnapshot
          }
          showTrends={
            showTrends
          }
          setShowTrends={
            setShowTrends
          }
        />


        {/* WEEKLY GRAPH */}

        <WeeklySpending
          weeks={weeks}
          selectedIndex={
            selectedWeekIndex
          }
          onSelect={
            setSelectedWeekIndex
          }
        />

      </main>


      {/* FLOATING ADD BUTTON */}

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


      {/* ADD MODAL */}

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