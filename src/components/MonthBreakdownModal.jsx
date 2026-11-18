import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  buildCategoryBreakdown,
  formatCurrency,
  getCategoryColor,
} from "../utils/expenseHelpers";


const VIEWS = [
  { id: "bars", label: "Bars" },
  { id: "pie", label: "Pie" },
  { id: "compare", label: "vs Last Month" },
];


export default function MonthBreakdownModal({
  month,
  expenses,
  onClose,
}) {

  const [view, setView] =
    useState("bars");


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


  const lastMonth =
    useMemo(() => {

      if (!month) {
        return null;
      }


      // January looks back to December of last year.
      const previous =
        new Date(
          month.year,
          month.monthIndex - 1,
          1
        );


      return buildCategoryBreakdown(
        expenses,
        previous.getFullYear(),
        previous.getMonth()
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


          <div
            className="simulation-toggle breakdown-view-toggle"
            role="group"
            aria-label="Breakdown view"
          >

            {VIEWS.map((option) => (

              <button
                key={option.id}
                type="button"
                className={
                  view === option.id
                    ? "active"
                    : ""
                }
                aria-pressed={
                  view === option.id
                }
                onClick={() =>
                  setView(option.id)
                }
              >
                {option.label}
              </button>

            ))}

          </div>


          {view === "compare" ? (

            <CompareView
              current={breakdown}
              previous={lastMonth}
            />

          ) : breakdown.categories.length ===
          0 ? (

            <div className="breakdown-empty">

              No expenses were recorded
              for this month.

            </div>

          ) : view === "pie" ? (

            <PieView
              breakdown={breakdown}
            />

          ) : (

            <BarsView
              breakdown={breakdown}
            />

          )}

        </div>

      </div>

    </div>

  );
}


// ======================================================
// BARS VIEW
// ======================================================

function BarsView({
  breakdown,
}) {

  return (

    <div className="category-breakdown-list">

      {breakdown.categories.map(
        (category) => (

          <div
            className="category-breakdown-item"
            key={category.category}
          >

            <div className="category-breakdown-top">

              <div className="category-breakdown-name">
                {category.category}
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


            <div className="category-bar-track">

              <div
                className="category-bar-fill"
                style={{
                  width: `${category.percentage}%`,
                  background:
                    getCategoryColor(
                      category.category
                    ),
                }}
              />

            </div>

          </div>

        )
      )}

    </div>

  );
}


// ======================================================
// PIE VIEW (a donut drawn with SVG stroke dashes)
// ======================================================

// Radius that makes the circumference exactly 100,
// so a slice's dash length is just its percentage.
const PIE_RADIUS = 15.9155;

function PieView({
  breakdown,
}) {

  // Each slice starts where the previous ones end.
  const slices =
    breakdown.categories.map(
      (category, index) => ({
        ...category,
        offset:
          breakdown.categories
            .slice(0, index)
            .reduce(
              (sum, earlier) =>
                sum + earlier.percentage,
              0
            ),
      })
    );


  // A thin gap keeps neighbors with the same color
  // (e.g. old Food and Groceries) apart.
  const gap =
    slices.length > 1
      ? 0.6
      : 0;


  return (

    <div className="breakdown-pie">

      <div className="breakdown-pie-chart">

        <svg
          viewBox="0 0 42 42"
          role="img"
          aria-label={
            slices
              .map(
                (slice) =>
                  `${slice.category} ${Math.round(slice.percentage)}%`
              )
              .join(", ")
          }
        >

          {slices.map((slice) => {

            const length =
              Math.max(
                slice.percentage - gap,
                0.3
              );

            return (

              <circle
                key={slice.category}
                cx="21"
                cy="21"
                r={PIE_RADIUS}
                fill="none"
                stroke={getCategoryColor(
                  slice.category
                )}
                strokeWidth="7"
                strokeDasharray={`${length} ${100 - length}`}
                // 25 starts the first slice at 12 o'clock.
                strokeDashoffset={25 - slice.offset}
              />

            );

          })}

        </svg>


        <div className="breakdown-pie-center">

          <span>
            Total
          </span>

          <strong>
            {formatCurrency(
              breakdown.totalSpent
            )}
          </strong>

        </div>

      </div>


      <ul className="breakdown-legend">

        {slices.map((slice) => (

          <li key={slice.category}>

            <span
              className="breakdown-legend-dot"
              style={{
                background:
                  getCategoryColor(
                    slice.category
                  ),
              }}
            />

            <span className="breakdown-legend-name">
              {slice.category}
            </span>

            <strong>
              {formatCurrency(
                slice.amount
              )}
            </strong>

            <span className="breakdown-legend-percent">
              {Math.round(
                slice.percentage
              )}
              %
            </span>

          </li>

        ))}

      </ul>

    </div>

  );
}


// ======================================================
// COMPARE VIEW (this month vs last month)
// ======================================================

function CompareView({
  current,
  previous,
}) {

  const thisAmounts =
    Object.fromEntries(
      current.categories.map(
        (category) => [
          category.category,
          category.amount,
        ]
      )
    );


  const lastAmounts =
    Object.fromEntries(
      previous.categories.map(
        (category) => [
          category.category,
          category.amount,
        ]
      )
    );


  // Every category from either month,
  // biggest this month first.
  const names = [
    ...Object.keys(thisAmounts),
    ...Object.keys(lastAmounts).filter(
      (name) =>
        !(name in thisAmounts)
    ),
  ];


  if (names.length === 0) {

    return (

      <div className="breakdown-empty">

        No expenses this month
        or last month.

      </div>

    );

  }


  // At least 1 so $0 months don't divide by zero.
  const largest =
    Math.max(
      1,
      ...names.map((name) =>
        Math.max(
          thisAmounts[name] || 0,
          lastAmounts[name] || 0
        )
      )
    );


  const totalChange =
    current.totalSpent -
    previous.totalSpent;


  return (

    <div className="breakdown-compare">

      <p className="breakdown-compare-total">

        {totalChange === 0
          ? "Same total as last month."
          : `${formatCurrency(Math.abs(totalChange))} ${
              totalChange > 0
                ? "more"
                : "less"
            } than last month in total.`}

      </p>


      <div className="breakdown-compare-key">

        <span>
          <i className="is-this" />
          This month
        </span>

        <span>
          <i className="is-last" />
          Last month
        </span>

      </div>


      <div className="category-breakdown-list">

        {names.map((name) => {

          const now =
            thisAmounts[name] || 0;

          const before =
            lastAmounts[name] || 0;

          const change =
            now - before;

          const color =
            getCategoryColor(name);


          return (

            <div
              className="category-breakdown-item"
              key={name}
            >

              <div className="category-breakdown-top">

                <div className="category-breakdown-name">
                  {name}
                </div>


                <div className="category-breakdown-values">

                  <strong>
                    {formatCurrency(now)}
                  </strong>


                  <span
                    className={
                      change > 0
                        ? "is-up"
                        : change < 0
                          ? "is-down"
                          : ""
                    }
                  >
                    {Math.abs(change) < 0.005
                      ? "same"
                      : `${change > 0 ? "▲" : "▼"} ${formatCurrency(Math.abs(change))}`}
                  </span>

                </div>

              </div>


              <div className="category-bar-track">

                <div
                  className="category-bar-fill"
                  style={{
                    width: `${(now / largest) * 100}%`,
                    background: color,
                  }}
                />

              </div>


              <div className="category-bar-track is-last">

                <div
                  className="category-bar-fill"
                  style={{
                    width: `${(before / largest) * 100}%`,
                    background: color,
                  }}
                />

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );
}
