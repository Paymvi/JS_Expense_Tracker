import {
  useMemo,
  useState,
} from "react";

import MonthlySnapshot from "../components/MonthlySnapshot";
import WeeklySpending from "../components/WeeklySpending";
import MonthBreakdownModal from "../components/MonthBreakdownModal";

import {
  buildMonthlySnapshot,
  buildWeeklySpending,
  formatCurrency,
  getCurrentMonthCount,
  getCurrentMonthTotal,
  parseExpenseDate,
} from "../utils/expenseHelpers";


// buildWeeklySpending always returns exactly this many weeks,
// oldest first, so the newest week is WEEK_COUNT - 1.
const WEEK_COUNT = 12;


export default function OverviewPage({
  expenses,
  today,
}) {

  // Midnight of the local day; changes at midnight / resume.
  const now =
    useMemo(
      () => parseExpenseDate(today),
      [today]
    );


  // ======================================================
  // UI STATE
  // ======================================================

  const [
    showTrends,
    setShowTrends,
  ] = useState(true);

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(null);


  // Newest week selected by default.
  const [
    selectedWeekIndex,
    setSelectedWeekIndex,
  ] = useState(WEEK_COUNT - 1);


  // ======================================================
  // CALCULATED DATA
  // ======================================================

  const currentMonthTotal =
    useMemo(() => {

      return getCurrentMonthTotal(
        expenses,
        now
      );

    }, [expenses, now]);


  const currentMonthCount =
    useMemo(() => {

      return getCurrentMonthCount(
        expenses,
        now
      );

    }, [expenses, now]);


  const monthlySnapshot =
    useMemo(() => {

      return buildMonthlySnapshot(
        expenses,
        3,
        now
      );

    }, [expenses, now]);


  const weeks =
    useMemo(() => {

      return buildWeeklySpending(
        expenses,
        WEEK_COUNT,
        now
      );

    }, [expenses, now]);


  // ======================================================
  // CURRENT MONTH NAME
  // ======================================================

  const currentMonthLabel =
    now.toLocaleString(
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

        onSelectMonth={
          setSelectedMonth
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

      <MonthBreakdownModal
        month={
          selectedMonth
        }

        expenses={
          expenses
        }

        onClose={() => {
          setSelectedMonth(
            null
          );
        }}
      />

    </main>

  );
}