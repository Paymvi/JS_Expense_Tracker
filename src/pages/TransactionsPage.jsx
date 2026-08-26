import {
  useMemo,
} from "react";

import {
  formatCurrency,
  parseExpenseDate,
} from "../utils/expenseHelpers";


export default function TransactionsPage({
  expenses,
  onEditExpense,
}) {

  // ======================================================
  // GROUP TRANSACTIONS BY DATE
  // ======================================================

  const transactionGroups =
    useMemo(() => {

      // Make a copy first.
      //
      // We NEVER want to sort expenses directly because
      // expenses is React state.
      const sortedExpenses = [
        ...expenses,
      ].sort((a, b) => {

        // First sort by the actual expense date.
        const dateComparison =
          String(b.date).localeCompare(
            String(a.date)
          );


        if (dateComparison !== 0) {
          return dateComparison;
        }


        // If two transactions happened on the same date,
        // put the most recently entered one first.
        return (
          new Date(
            b.createdAt || 0
          ).getTime() -
          new Date(
            a.createdAt || 0
          ).getTime()
        );

      });


      // We'll build something like:
      //
      // [
      //   {
      //     date: "2026-08-25",
      //     total: 54.25,
      //     expenses: [...]
      //   }
      // ]

      const groups = [];


      sortedExpenses.forEach(
        (expense) => {

          // See if we already made a section
          // for this date.
          let group =
            groups.find(
              (existingGroup) =>
                existingGroup.date ===
                expense.date
            );


          // If not, create it.
          if (!group) {

            group = {
              date: expense.date,

              total: 0,

              expenses: [],
            };


            groups.push(group);
          }


          // Add the amount to the daily total.
          group.total += Number(
            expense.amount || 0
          );


          // Add the transaction to that day.
          group.expenses.push(
            expense
          );

        }
      );


      return groups;

    }, [expenses]);


  // ======================================================
  // FORMAT DATE HEADER
  // ======================================================

  function formatTransactionDate(
    dateString
  ) {

    const date =
      parseExpenseDate(
        dateString
      );


    if (!date) {
      return dateString;
    }


    const currentYear =
      new Date().getFullYear();


    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };


    // If the expense is from another year,
    // also display the year.
    if (
      date.getFullYear() !==
      currentYear
    ) {
      options.year =
        "numeric";
    }


    return date.toLocaleDateString(
      "en-US",
      options
    );

  }


  // ======================================================
  // EMPTY STATE
  // ======================================================

  if (expenses.length === 0) {

    return (

      <main className="app-shell">

        <header className="transactions-header">

          <div className="app-eyebrow">
            Expense Tracker
          </div>

          <h1>
            Transactions
          </h1>

        </header>


        <div className="transactions-empty">

          <div className="transactions-empty-icon">
            $
          </div>

          <h2>
            No transactions yet
          </h2>

          <p>
            Add your first expense and it will
            appear here.
          </p>

        </div>

      </main>

    );

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <main className="app-shell">

      {/* PAGE HEADER */}

      <header className="transactions-header">

        <div>

          <div className="app-eyebrow">
            Expense Tracker
          </div>

          <h1>
            Transactions
          </h1>

        </div>


        <div className="transaction-count">

          {expenses.length}{" "}

          {expenses.length === 1
            ? "transaction"
            : "transactions"}

        </div>

      </header>


      {/* TRANSACTION GROUPS */}

      <div className="transaction-groups">

        {transactionGroups.map(
          (group) => (

            <section
              className="transaction-day"
              key={group.date}
            >

              {/* DATE + DAILY TOTAL */}

              <div className="transaction-day-header">

                <h2>
                  {formatTransactionDate(
                    group.date
                  )}
                </h2>


                <strong>
                  {formatCurrency(
                    group.total
                  )}
                </strong>

              </div>


              {/* EXPENSES FROM THAT DAY */}

              <div className="transaction-list">

                {group.expenses.map(
                  (expense) => (

                    <button
                      type="button"
                      className="transaction-row"
                      key={expense.id}
                      onClick={() => {
                        onEditExpense(expense);
                      }}
                    >

                      {/* LEFT SIDE */}

                      <div className="transaction-info">

                        <div className="transaction-name">

                          {expense.description ||
                            "Expense"}

                        </div>


                        <div className="transaction-category">

                          {expense.category ||
                            "Other"}

                        </div>

                      </div>


                      {/* RIGHT SIDE */}

                      <div className="transaction-amount">

                        {formatCurrency(
                          expense.amount
                        )}

                      </div>

                    </button>

                  )
                )}

              </div>

            </section>

          )
        )}

      </div>

    </main>

  );
}