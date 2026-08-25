import React from "react";
import { formatCurrency } from "../utils/expenseHelpers";


export default function MonthlySnapshot({
  monthlySnapshot,
  showTrends,
  setShowTrends,
}) {
  return (
    <section className="profile-section">

      <div className="section-heading-row">

        <h2 className="section-title">
          Monthly snapshot
        </h2>

        <button
          type="button"
          className="trend-toggle"
          onClick={() => {
            setShowTrends((previous) => !previous);
          }}
        >
          {showTrends ? "Hide trends" : "Show trends"}
        </button>

      </div>


      <div className="month-snap-row">

        {monthlySnapshot.map((month) => {

          return (
            <article
              key={`${month.year}-${month.month}`}
              className="month-card"
            >

              <div className="month-title">
                {month.month} {month.year}
              </div>


              {/* MAIN NUMBER */}

              <div className="month-hero">
                {formatCurrency(month.total)}
              </div>


              {/* COMPARED WITH PREVIOUS MONTH */}

              {showTrends &&
                month.percentageChange !== null && (

                  <div className="month-trend">

                    {month.percentageChange > 0 && "▲ "}

                    {month.percentageChange < 0 && "▼ "}

                    {Math.abs(
                      month.percentageChange
                    ).toFixed(1)}
                    %

                    <span>
                      {" "}
                      vs previous month
                    </span>

                  </div>

                )}


              {/* SECONDARY INFORMATION */}

              <div className="month-secondary">

                <div className="metric-row">

                  <span>
                    Transactions
                  </span>

                  <strong>
                    {month.transactionCount}
                  </strong>

                </div>


                <div className="metric-row">

                  <span>
                    Top category
                  </span>

                  <strong>
                    {month.topCategory || "—"}
                  </strong>

                </div>

              </div>

            </article>
          );

        })}

      </div>

    </section>
  );
}