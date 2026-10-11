import {
  useMemo,
  useState,
} from "react";

import {
  formatCurrency,
  parseExpenseDate,
} from "../utils/expenseHelpers";

import ImportExportControls
  from "../components/ImportExportControls";


// ======================================================
// CATEGORY HELPERS
// ======================================================

function normalizeCategory(
  category
) {

  const normalized =
    String(
      category || "Other"
    )
      .trim()
      .toLowerCase();


  if (
    normalized.includes(
      "food"
    )
  ) {
    return "food";
  }


  if (
    normalized.includes(
      "shop"
    )
  ) {
    return "shopping";
  }


  if (
    normalized.includes(
      "entertain"
    )
  ) {
    return "entertainment";
  }


  if (
    normalized.includes(
      "transport"
    ) ||
    normalized.includes(
      "gas"
    ) ||
    normalized.includes(
      "car"
    )
  ) {
    return "transport";
  }


  if (
    normalized.includes(
      "bill"
    ) ||
    normalized.includes(
      "utility"
    )
  ) {
    return "bills";
  }


  if (
    normalized.includes(
      "health"
    ) ||
    normalized.includes(
      "medical"
    )
  ) {
    return "health";
  }


  return "other";

}


// ======================================================
// CATEGORY ICON
// ======================================================

function CategoryIcon({
  category,
}) {

  const normalized =
    normalizeCategory(
      category
    );


  // ------------------------------------------------------
  // FOOD
  // ------------------------------------------------------

  if (
    normalized === "food"
  ) {

    return (

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >

        <path
          d="
            M7 3
            V10

            M4.5 3
            V7.5

            M9.5 3
            V7.5

            M4.5 7.5
            C4.5 9
            5.5 10
            7 10

            V21

            M15 3
            V21

            M15 3
            C18 4.5
            19 7
            19 10

            V12
            H15
          "
        />

      </svg>

    );

  }


  // ------------------------------------------------------
  // SHOPPING
  // ------------------------------------------------------

  if (
    normalized === "shopping"
  ) {

    return (

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >

        <path
          d="
            M5 8
            H19

            L20 21
            H4

            L5 8

            Z

            M8 9
            V7

            C8 4.8
            9.8 3
            12 3

            C14.2 3
            16 4.8
            16 7

            V9
          "
        />

      </svg>

    );

  }


  // ------------------------------------------------------
  // ENTERTAINMENT
  // ------------------------------------------------------

  if (
    normalized ===
    "entertainment"
  ) {

    return (

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >

        <path
          d="
            M4 9
            L14.5 3

            L20 8.5

            C18.6 9.9
            18.6 12.1
            20 13.5

            L9.5 20

            L4 14.5

            C5.4 13.1
            5.4 10.9
            4 9

            Z
          "
        />

      </svg>

    );

  }


  // ------------------------------------------------------
  // TRANSPORT
  // ------------------------------------------------------

  if (
    normalized === "transport"
  ) {

    return (

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >

        <path
          d="
            M5 16
            H19

            M6.5 16
            L7.8 9

            H16.2

            L17.5 16

            M7 19
            H7.01

            M17 19
            H17.01

            M4 16
            V19

            H20
            V16

            L18 12

            H6

            L4 16
          "
        />

      </svg>

    );

  }


  // ------------------------------------------------------
  // BILLS
  // ------------------------------------------------------

  if (
    normalized === "bills"
  ) {

    return (

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >

        <path
          d="
            M6 3
            H18

            V21

            L15.5 19
            L13 21
            L10.5 19
            L8 21
            L6 19

            Z

            M9 8
            H15

            M9 12
            H15

            M9 16
            H13
          "
        />

      </svg>

    );

  }


  // ------------------------------------------------------
  // HEALTH
  // ------------------------------------------------------

  if (
    normalized === "health"
  ) {

    return (

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >

        <path
          d="
            M12 21

            C8 18
            4 14.7
            4 9.8

            C4 6.8
            6.1 5
            8.5 5

            C10 5
            11.3 5.8
            12 7

            C12.7 5.8
            14 5
            15.5 5

            C17.9 5
            20 6.8
            20 9.8

            C20 14.7
            16 18
            12 21

            Z
          "
        />

      </svg>

    );

  }


  // ------------------------------------------------------
  // OTHER
  // ------------------------------------------------------

  return (

    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >

      <circle
        cx="12"
        cy="12"
        r="8"
      />

      <path
        d="
          M9 12
          H15

          M12 9
          V15
        "
      />

    </svg>

  );

}


// ======================================================
// SMALL SEARCH ICON
// ======================================================

function SearchIcon() {

  return (

    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >

      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path
        d="
          M16 16
          L21 21
        "
      />

    </svg>

  );

}


// ======================================================
// CHEVRON
// ======================================================

function ChevronIcon({
  direction = "right",
}) {

  const rotation =
    direction === "up"
      ? "-90deg"
      : direction === "down"
      ? "90deg"
      : "0deg";


  return (

    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        transform:
          `rotate(${rotation})`,
      }}
    >

      <path
        d="
          M9 5
          L16 12
          L9 19
        "
      />

    </svg>

  );

}


// ======================================================
// TRANSACTIONS PAGE
// ======================================================

export default function TransactionsPage({
  expenses,
  onEditExpense,
  onExportExpenses,
  onImportExpenses,
}) {

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);


  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  const [
    collapsedDates,
    setCollapsedDates,
  ] = useState(
    () => new Set()
  );


  // ======================================================
  // SPLIT "PREFIX: DESCRIPTION"
  // ======================================================

  function parseTransactionDescription(
    description
  ) {

    const originalDescription =
      String(
        description || "Expense"
      ).trim();


    const colonIndex =
      originalDescription.indexOf(
        ":"
      );


    if (
      colonIndex === -1
    ) {

      return {
        prefix:
          null,

        description:
          originalDescription,
      };

    }


    const possiblePrefix =
      originalDescription
        .slice(
          0,
          colonIndex
        )
        .trim();


    const remainingDescription =
      originalDescription
        .slice(
          colonIndex + 1
        )
        .trim();


    if (
      !possiblePrefix ||
      !remainingDescription
    ) {

      return {
        prefix:
          null,

        description:
          originalDescription,
      };

    }


    return {
      prefix:
        possiblePrefix,

      description:
        remainingDescription,
    };

  }


  // ======================================================
  // SEARCHED EXPENSES
  // ======================================================

  const visibleExpenses =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      if (!query) {
        return expenses;
      }


      return expenses.filter(
        (expense) => {

          const searchableText = [
            expense.description,
            expense.category,
            expense.amount,
            expense.date,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return (
            searchableText.includes(
              query
            )
          );

        }
      );

    }, [
      expenses,
      searchQuery,
    ]);


  // ======================================================
  // GROUP TRANSACTIONS BY DATE
  // ======================================================

  const transactionGroups =
    useMemo(() => {

      const sortedExpenses = [
        ...visibleExpenses,
      ].sort((a, b) => {

        const dateComparison =
          String(
            b.date
          ).localeCompare(
            String(
              a.date
            )
          );


        if (
          dateComparison !== 0
        ) {

          return dateComparison;

        }


        return (
          new Date(
            b.createdAt || 0
          ).getTime() -
          new Date(
            a.createdAt || 0
          ).getTime()
        );

      });


      const groups = [];


      sortedExpenses.forEach(
        (expense) => {

          let group =
            groups.find(
              (existingGroup) =>
                existingGroup.date ===
                expense.date
            );


          if (!group) {

            group = {
              date:
                expense.date,

              total:
                0,

              expenses:
                [],
            };


            groups.push(
              group
            );

          }


          group.total +=
            Number(
              expense.amount || 0
            );


          group.expenses.push(
            expense
          );

        }
      );


      return groups;

    }, [visibleExpenses]);


  // ======================================================
  // CURRENT MONTH SUMMARY
  // ======================================================

  const monthSummary =
    useMemo(() => {

      const now =
        new Date();


      const currentMonth =
        now.getMonth();


      const currentYear =
        now.getFullYear();


      const monthExpenses =
        expenses.filter(
          (expense) => {

            const date =
              parseExpenseDate(
                expense.date
              );


            if (!date) {
              return false;
            }


            return (
              date.getMonth() ===
                currentMonth &&
              date.getFullYear() ===
                currentYear
            );

          }
        );


      const total =
        monthExpenses.reduce(
          (
            sum,
            expense
          ) =>
            sum +
            Number(
              expense.amount || 0
            ),
          0
        );


      // True calendar-day average for the
      // current month so far.
      const daysElapsed =
        Math.max(
          1,
          now.getDate()
        );


      const dailyAverage =
        total /
        daysElapsed;


      const monthName =
        now
          .toLocaleDateString(
            "en-US",
            {
              month:
                "long",
            }
          )
          .toUpperCase();


      return {
        monthName,
        total,
        count:
          monthExpenses.length,
        dailyAverage,
      };

    }, [expenses]);


  // ======================================================
  // DATE HEADER
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
      new Date()
        .getFullYear();


    const options = {
      weekday:
        "short",

      month:
        "short",

      day:
        "numeric",
    };


    if (
      date.getFullYear() !==
      currentYear
    ) {

      options.year =
        "numeric";

    }


    return (
      date.toLocaleDateString(
        "en-US",
        options
      )
    );

  }


  // ======================================================
  // COLLAPSE / EXPAND DAY
  // ======================================================

  function toggleDate(
    date
  ) {

    setCollapsedDates(
      (previous) => {

        const next =
          new Set(
            previous
          );


        if (
          next.has(
            date
          )
        ) {

          next.delete(
            date
          );

        } else {

          next.add(
            date
          );

        }


        return next;

      }
    );

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <main className="app-shell tx-page">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <header className="tx-header">

        <div className="tx-header-copy">

          <h1>
            Transactions
          </h1>

          <p>
            A record of everything
            you spend on.
          </p>

        </div>


        <button
          type="button"
          className={
            `tx-search-trigger ${
              searchOpen
                ? "is-active"
                : ""
            }`
          }
          aria-label={
            searchOpen
              ? "Close transaction search"
              : "Search transactions"
          }
          onClick={() => {

            setSearchOpen(
              (previous) =>
                !previous
            );

            if (searchOpen) {

              setSearchQuery("");

            }

          }}
        >

          <SearchIcon />

        </button>

      </header>


      {/* ==================================================
          SEARCH
      ================================================== */}

      {searchOpen && (

        <div className="tx-search-panel">

          <span className="tx-search-panel-icon">

            <SearchIcon />

          </span>


          <input
            type="search"
            value={
              searchQuery
            }
            onChange={
              (event) =>
                setSearchQuery(
                  event.target.value
                )
            }
            placeholder="Search transactions..."
            autoFocus
          />


          {searchQuery && (

            <button
              type="button"
              className="tx-search-clear"
              onClick={() =>
                setSearchQuery("")
              }
              aria-label="Clear search"
            >
              ×
            </button>

          )}

        </div>

      )}


      {/* ==================================================
          MONTH SUMMARY
      ================================================== */}

      <section className="tx-month-card">

        <div className="tx-month-copy">

          <div className="tx-month-label">

            {monthSummary.monthName}
            {" "}
            Spending

          </div>


          <div className="tx-month-total">

            {formatCurrency(
              monthSummary.total
            )}

          </div>


          <div className="tx-month-stats">

            <div className="tx-month-stat">

              <strong>
                {monthSummary.count}
              </strong>

              <span>
                {monthSummary.count === 1
                  ? "Transaction"
                  : "Transactions"}
              </span>

            </div>


            <div className="tx-month-stat-divider" />


            <div className="tx-month-stat">

              <strong>
                {formatCurrency(
                  monthSummary.dailyAverage
                )}
              </strong>

              <span>
                Daily Average
              </span>

            </div>

          </div>

        </div>


        {/* Decorative artwork */}

        <div
          className="tx-summary-art"
          aria-hidden="true"
        >

          <div className="tx-summary-bars">

            <span />
            <span />
            <span />
            <span />

          </div>


          <div className="tx-summary-plant">

            <span className="tx-plant-stem" />

            <span className="tx-leaf tx-leaf-one" />

            <span className="tx-leaf tx-leaf-two" />

            <span className="tx-leaf tx-leaf-three" />

          </div>

        </div>

      </section>


      {/* ==================================================
          BACKUP CONTROLS
      ================================================== */}

      <div className="tx-backup-row">

        <ImportExportControls
          onExport={
            onExportExpenses
          }

          onImport={
            onImportExpenses
          }
        />

      </div>


      {/* ==================================================
          SEARCH RESULT COUNT
      ================================================== */}

      {searchQuery && (

        <div className="tx-search-result-count">

          {visibleExpenses.length === 1
            ? "1 matching transaction"
            : `${visibleExpenses.length} matching transactions`}

        </div>

      )}


      {/* ==================================================
          EMPTY STATE
      ================================================== */}

      {transactionGroups.length === 0 && (

        <div className="tx-empty">

          <div className="tx-empty-icon">
            $
          </div>

          <h2>

            {searchQuery
              ? "No matches"
              : "No transactions yet"}

          </h2>

          <p>

            {searchQuery
              ? "Try a different search."
              : "Add your first expense and it will appear here."}

          </p>

        </div>

      )}


      {/* ==================================================
          TRANSACTION GROUPS
      ================================================== */}

      <div className="tx-groups">

        {transactionGroups.map(
          (group) => {

            const isCollapsed =
              collapsedDates.has(
                group.date
              );


            return (

              <section
                className="tx-day"
                key={group.date}
              >

                {/* ==========================================
                    DAY HEADER
                ========================================== */}

                <div className="tx-day-heading">

                  <h2>

                    {formatTransactionDate(
                      group.date
                    )}

                  </h2>


                  <button
                    type="button"
                    className="tx-day-total"
                    onClick={() =>
                      toggleDate(
                        group.date
                      )
                    }
                    aria-expanded={
                      !isCollapsed
                    }
                  >

                    <strong>

                      {formatCurrency(
                        group.total
                      )}

                    </strong>


                    <span className="tx-day-chevron">

                      <ChevronIcon
                        direction={
                          isCollapsed
                            ? "down"
                            : "up"
                        }
                      />

                    </span>

                  </button>

                </div>


                {/* ==========================================
                    DAY CARD
                ========================================== */}

                {!isCollapsed && (

                  <div className="tx-day-card">

                    {group.expenses.map(
                      (expense) => {

                        const {
                          prefix,
                          description,
                        } =
                          parseTransactionDescription(
                            expense.description
                          );


                        const category =
                          expense.category ||
                          "Other";


                        const categoryType =
                          normalizeCategory(
                            category
                          );


                        return (

                          <button
                            type="button"
                            className="tx-row"
                            key={expense.id}
                            onClick={() => {

                              onEditExpense(
                                expense
                              );

                            }}
                          >

                            {/* CATEGORY ICON */}

                            <div
                              className={
                                `tx-category-icon tx-category-${categoryType}`
                              }
                            >

                              <CategoryIcon
                                category={
                                  category
                                }
                              />

                            </div>


                            {/* TEXT */}

                            <div className="tx-row-copy">

                              {prefix && (

                                <div className="tx-prefix">

                                  {prefix}

                                </div>

                              )}


                              <div className="tx-description">

                                {description}

                              </div>


                              <div
                                className={
                                  `tx-category-pill tx-category-${categoryType}`
                                }
                              >

                                {category}

                              </div>

                            </div>


                            {/* PRICE */}

                            <div className="tx-price-area">

                              <strong>

                                {formatCurrency(
                                  expense.amount
                                )}

                              </strong>


                              <span className="tx-row-chevron">

                                <ChevronIcon />

                              </span>

                            </div>

                          </button>

                        );

                      }
                    )}

                  </div>

                )}

              </section>

            );

          }
        )}

      </div>

    </main>

  );

}