import {
  useEffect,
  useMemo,
} from "react";

import {
  buildCategoryBreakdown,
  formatCurrency,
} from "../utils/expenseHelpers";


export default function MonthBreakdownModal({
  month,
  expenses,
  onClose,
}) {

  // ======================================================
  // CATEGORY DATA
  // ======================================================

  const breakdown =
    useMemo(() => {

      if (!month) {
        return null;
      }


      return buildCategoryBreakdown(
        expenses,
        month.year,
        month.monthIndex
      );

    }, [
      expenses,
      month,
    ]);


  // ======================================================
  // ESCAPE KEY
  // ======================================================

  useEffect(() => {

    if (!month) {
      return;
    }


    function handleKeyDown(
      event
    ) {

      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }

    }


    window.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [
    month,
    onClose,
  ]);


  // ======================================================
  // DON'T RENDER WHEN CLOSED
  // ======================================================

  if (
    !month ||
    !breakdown
  ) {
    return null;
  }


  // ======================================================
  // FULL MONTH NAME
  // ======================================================

  const monthName =
    new Date(
      month.year,
      month.monthIndex,
      1
    ).toLocaleString(
      "en-US",
      {
        month: "long",
      }
    );


  // ======================================================
  // UI
  // ======================================================

  return (

    <div
      className="modal-backdrop"
      onMouseDown={(event) => {

        // Only close when clicking
        // the dark background itself.
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }

      }}
    >

      <div className="month-breakdown-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="month-breakdown-header">

          <div>

            <div className="modal-eyebrow">
              Spending breakdown
            </div>


            <h2>
              {monthName}{" "}
              {month.year}
            </h2>

          </div>


          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

        </div>


        {/* =================================================
            MONTH SUMMARY
        ================================================= */}

        <div className="breakdown-summary">

          <div>

            <span>
              Total spent
            </span>

            <strong>
              {formatCurrency(
                breakdown.totalSpent
              )}
            </strong>

          </div>


          <div>

            <span>
              Transactions
            </span>

            <strong>
              {
                breakdown.transactionCount
              }
            </strong>

          </div>

        </div>


        {/* =================================================
            CATEGORY BREAKDOWN
        ================================================= */}

        <div className="breakdown-section">

          <h3>
            Where your money went
          </h3>


          {breakdown.categories.length ===
          0 ? (

            <div className="breakdown-empty">

              No expenses were recorded
              for this month.

            </div>

          ) : (

            <div className="category-breakdown-list">

              {breakdown.categories.map(
                (category) => (

                  <div
                    className="category-breakdown-item"
                    key={
                      category.category
                    }
                  >

                    {/* LABEL + NUMBERS */}

                    <div className="category-breakdown-top">

                      <div className="category-breakdown-name">

                        {
                          category.category
                        }

                      </div>


                      <div className="category-breakdown-values">

                        <strong>
                          {formatCurrency(
                            category.amount
                          )}
                        </strong>


                        <span>
                          {Math.round(
                            category.percentage
                          )}
                          %
                        </span>

                      </div>

                    </div>


                    {/* BAR */}

                    <div className="category-bar-track">

                      <div
                        className="category-bar-fill"
                        style={{
                          width: `${category.percentage}%`,
                        }}
                      />

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </div>

  );
}