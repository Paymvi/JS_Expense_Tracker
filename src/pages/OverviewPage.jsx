import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MonthlySnapshot from "../components/MonthlySnapshot";
import WeeklySpending from "../components/WeeklySpending";

import {
  buildMonthlySnapshot,
  buildWeeklySpending,
  formatCurrency,
  getCurrentMonthCount,
  getCurrentMonthTotal,
} from "../utils/expenseHelpers";


export default function OverviewPage({
  expenses,
}) {

  // ======================================================
  // UI STATE
  // ======================================================

  const [
    showTrends,
    setShowTrends,
  ] = useState(true);


  const [
    selectedWeekIndex,
    setSelectedWeekIndex,
  ] = useState(0);


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


  // ======================================================
  // SELECT NEWEST WEEK BY DEFAULT
  // ======================================================

  useEffect(() => {

    if (weeks.length > 0) {

      setSelectedWeekIndex(
        weeks.length - 1
      );

    }

  }, [weeks.length]);


  // ======================================================
  // CURRENT MONTH NAME
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


      {/* THIS MONTH */}

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


      {/* MONTHLY SNAPSHOT */}

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

  );
}