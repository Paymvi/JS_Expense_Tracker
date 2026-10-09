import {
  useEffect,
  useMemo,
  useState,
} from "react";


const BILL_OPTIONS = [
  5,
  10,
  20,
];


const HOURLY_RATE_STORAGE_KEY =
  "expense-tracker-hourly-rate-v1";


export default function VisualizerPage({
  expenses = [],
}) {

  // ======================================================
  // MONEY VISUALIZER STATE
  // ======================================================

  const [
    amount,
    setAmount,
  ] = useState("");


  const [
    selectedBill,
    setSelectedBill,
  ] = useState(5);



  // ======================================================
  // WORK HOURS STATE
  // ======================================================

  const [
    hourlyRate,
    setHourlyRate,
  ] = useState(() => {

    try {

      return (
        localStorage.getItem(
          HOURLY_RATE_STORAGE_KEY
        ) || ""
      );

    } catch (error) {

      console.error(
        "Could not load hourly rate:",
        error
      );


      return "";

    }

  });



  // ======================================================
  // WHAT IF STATE
  // ======================================================

  const [
    purchaseName,
    setPurchaseName,
  ] = useState("");


  const [
    purchaseAmount,
    setPurchaseAmount,
  ] = useState("");


  const [
    simulationMode,
    setSimulationMode,
  ] = useState("without");



  // ======================================================
  // NUMERIC VALUES
  // ======================================================

  const numericAmount =
    Number.parseFloat(amount) || 0;


  const numericPurchaseAmount =
    Number.parseFloat(
      purchaseAmount
    ) || 0;


  const numericHourlyRate =
    Number.parseFloat(
      hourlyRate
    ) || 0;



  // ======================================================
  // SAVE HOURLY RATE
  // ======================================================

  useEffect(() => {

    try {

      localStorage.setItem(
        HOURLY_RATE_STORAGE_KEY,
        hourlyRate
      );

    } catch (error) {

      console.error(
        "Could not save hourly rate:",
        error
      );

    }

  }, [hourlyRate]);



  // ======================================================
  // MONEY VISUALIZER BILL CALCULATION
  // ======================================================

  const calculation =
    useMemo(() => {

      if (
        numericAmount <= 0 ||
        !selectedBill
      ) {

        return {
          billCount: 0,
          remainder: 0,
        };

      }


      const cents =
        Math.round(
          numericAmount * 100
        );


      const billCents =
        selectedBill * 100;


      const billCount =
        Math.floor(
          cents / billCents
        );


      const remainder =
        (
          cents %
          billCents
        ) / 100;


      return {
        billCount,
        remainder,
      };

    }, [
      numericAmount,
      selectedBill,
    ]);



  // ======================================================
  // PURCHASE BILL CALCULATION
  // ======================================================

  const purchaseCalculation =
    useMemo(() => {

      if (
        numericPurchaseAmount <= 0 ||
        !selectedBill
      ) {

        return {
          billCount: 0,
          remainder: 0,
        };

      }


      const cents =
        Math.round(
          numericPurchaseAmount * 100
        );


      const billCents =
        selectedBill * 100;


      const billCount =
        Math.floor(
          cents / billCents
        );


      const remainder =
        (
          cents %
          billCents
        ) / 100;


      return {
        billCount,
        remainder,
      };

    }, [
      numericPurchaseAmount,
      selectedBill,
    ]);



  // ======================================================
  // CURRENT MONTH SPENDING
  // ======================================================

  const monthlySpending =
    useMemo(() => {

      const now =
        new Date();


      const currentYear =
        now.getFullYear();


      const currentMonth =
        now.getMonth();


      return expenses.reduce(
        (
          total,
          expense
        ) => {

          const rawDate =
            expense.date ||
            expense.transactionDate ||
            expense.createdAt;


          if (!rawDate) {

            return total;

          }


          let expenseDate;


          if (
            typeof rawDate === "string" &&
            /^\d{4}-\d{2}-\d{2}/.test(
              rawDate
            )
          ) {

            const [
              year,
              month,
              day,
            ] =
              rawDate
                .slice(0, 10)
                .split("-")
                .map(Number);


            expenseDate =
              new Date(
                year,
                month - 1,
                day
              );

          } else {

            expenseDate =
              new Date(
                rawDate
              );

          }


          if (
            Number.isNaN(
              expenseDate.getTime()
            )
          ) {

            return total;

          }


          const isCurrentMonth =
            expenseDate.getFullYear() ===
              currentYear &&
            expenseDate.getMonth() ===
              currentMonth;


          if (!isCurrentMonth) {

            return total;

          }


          const expenseAmount =
            Number.parseFloat(
              expense.amount
            ) || 0;


          return (
            total +
            expenseAmount
          );

        },
        0
      );

    }, [expenses]);



  // ======================================================
  // CURRENT MONTH AVERAGES
  // ======================================================

  const currentDayOfMonth =
    new Date().getDate();


  const currentDailyAverage =
    currentDayOfMonth > 0
      ? monthlySpending /
        currentDayOfMonth
      : 0;



  // ======================================================
  // PURCHASE SIMULATION
  // ======================================================

  const simulatedMonthlySpending =
    monthlySpending +
    numericPurchaseAmount;


  const simulatedDailyAverage =
    currentDayOfMonth > 0
      ? simulatedMonthlySpending /
        currentDayOfMonth
      : 0;


  const scenarioMonthlySpending =
    simulationMode === "with"
      ? simulatedMonthlySpending
      : monthlySpending;


  const scenarioDailyAverage =
    simulationMode === "with"
      ? simulatedDailyAverage
      : currentDailyAverage;



  // ======================================================
  // WORK HOURS
  // ======================================================

  const workMinutes =
    numericAmount > 0 &&
    numericHourlyRate > 0
      ? Math.round(
          (
            numericAmount /
            numericHourlyRate
          ) * 60
        )
      : 0;


  const workDays =
    workMinutes > 0
      ? workMinutes /
        60 /
        8
      : 0;



  // ======================================================
  // PURCHASE WORK HOURS
  // ======================================================

  const purchaseWorkMinutes =
    numericPurchaseAmount > 0 &&
    numericHourlyRate > 0
      ? Math.round(
          (
            numericPurchaseAmount /
            numericHourlyRate
          ) * 60
        )
      : 0;



  // ======================================================
  // INPUT HANDLERS
  // ======================================================

  function handleAmountChange(
    event
  ) {

    const value =
      event.target.value;


    if (
      value === "" ||
      /^\d*\.?\d{0,2}$/.test(
        value
      )
    ) {

      setAmount(
        value
      );

    }

  }


  function handleHourlyRateChange(
    event
  ) {

    const value =
      event.target.value;


    if (
      value === "" ||
      /^\d*\.?\d{0,2}$/.test(
        value
      )
    ) {

      setHourlyRate(
        value
      );

    }

  }


  function handlePurchaseAmountChange(
    event
  ) {

    const value =
      event.target.value;


    if (
      value === "" ||
      /^\d*\.?\d{0,2}$/.test(
        value
      )
    ) {

      setPurchaseAmount(
        value
      );

    }

  }



  // ======================================================
  // FORMAT MONEY
  // ======================================================

  function formatMoney(
    value
  ) {

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
      }
    ).format(
      value
    );

  }



  // ======================================================
  // FORMAT WORK TIME
  // ======================================================

  function formatWorkTime(
    minutes
  ) {

    if (minutes <= 0) {

      return "—";

    }


    const hours =
      Math.floor(
        minutes / 60
      );


    const remainingMinutes =
      minutes % 60;


    if (hours === 0) {

      return `${remainingMinutes} min`;

    }


    if (
      remainingMinutes === 0
    ) {

      return `${
        hours
      } ${
        hours === 1
          ? "hr"
          : "hrs"
      }`;

    }


    return `${
      hours
    } ${
      hours === 1
        ? "hr"
        : "hrs"
    } ${remainingMinutes} min`;

  }



  // ======================================================
  // UI
  // ======================================================

  return (

    <main className="visualizer-page">

      {/* =========================================
          MONEY VISUALIZER
      ========================================= */}

      <section className="visualizer-header">

        <div className="visualizer-heading">

          <p className="visualizer-eyebrow">
            Money Visualizer
          </p>


          <h1>
            See what your money
            actually looks like.
          </h1>


          <p className="visualizer-description">

            Enter an amount and choose
            a bill denomination to see
            exactly how many physical
            bills that amount represents.

          </p>

        </div>



        {/* AMOUNT INPUT */}

        <div className="visualizer-input-shell">

          <span className="visualizer-dollar-sign">
            $
          </span>


          <input
            className="visualizer-amount-input"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={
              handleAmountChange
            }
            placeholder="0.00"
            aria-label="Money amount"
          />

        </div>



        {/* BILL SELECTOR */}

        <div className="visualizer-bill-selector">

          <span className="visualizer-selector-label">
            Show this amount in:
          </span>


          <div className="visualizer-bill-buttons">

            {BILL_OPTIONS.map(
              (bill) => {

                const isSelected =
                  selectedBill ===
                  bill;


                return (

                  <button
                    key={bill}
                    type="button"
                    className={
                      `visualizer-bill-button ${
                        isSelected
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={() =>
                      setSelectedBill(
                        bill
                      )
                    }
                    aria-pressed={
                      isSelected
                    }
                  >

                    ${bill}

                  </button>

                );

              }
            )}

          </div>

        </div>

      </section>



      {/* =========================================
          MONEY VISUALIZER EMPTY STATE
      ========================================= */}

      {numericAmount <= 0 && (

        <section className="visualizer-empty">

          <div className="visualizer-empty-icon">

            <span>
              $
            </span>

          </div>


          <h2>
            Enter an amount above
          </h2>


          <p>
            Try something like $20,
            $100, $600, or the price
            of something you're
            considering buying.
          </p>

        </section>

      )}



      {/* =========================================
          MONEY VISUALIZATION RESULTS
      ========================================= */}

      {numericAmount > 0 && (

        <section className="visualizer-results">

          {/* SUMMARY */}

          <div className="visualizer-summary">

            <div className="visualizer-summary-main">

              <span className="visualizer-summary-amount">

                {formatMoney(
                  numericAmount
                )}

              </span>


              <span className="visualizer-summary-equals">
                is
              </span>


              <strong className="visualizer-summary-count">

                {
                  calculation.billCount
                }

              </strong>


              <span className="visualizer-summary-description">

                ${selectedBill}{" "}

                {
                  calculation.billCount ===
                  1
                    ? "bill"
                    : "bills"
                }

              </span>

            </div>



            {calculation.remainder > 0 && (

              <div className="visualizer-remainder">

                +

                <strong>

                  {formatMoney(
                    calculation.remainder
                  )}

                </strong>

                remaining

              </div>

            )}

          </div>



          {/* BILL GRID */}

          {calculation.billCount > 0 ? (

            <div className="visualizer-bills">

              {Array.from(
                {
                  length:
                    calculation.billCount,
                },
                (
                  _,
                  index
                ) => (

                  <div
                    className={
                      `money-bill money-bill-${selectedBill}`
                    }
                    key={index}
                    aria-hidden="true"
                  >

                    <div className="money-bill-corner money-bill-corner-left">

                      ${selectedBill}

                    </div>


                    <div className="money-bill-center">

                      <span className="money-bill-symbol">
                        $
                      </span>


                      <strong>
                        {selectedBill}
                      </strong>


                      <span className="money-bill-name">

                        {
                          selectedBill === 5
                            ? "FIVE DOLLARS"
                            : selectedBill === 10
                            ? "TEN DOLLARS"
                            : "TWENTY DOLLARS"
                        }

                      </span>

                    </div>


                    <div className="money-bill-corner money-bill-corner-right">

                      ${selectedBill}

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="visualizer-no-full-bills">

              <span>

                This amount is less
                than one ${selectedBill}
                bill.

              </span>


              <strong>

                {formatMoney(
                  numericAmount
                )}

              </strong>

            </div>

          )}



          {/* FOOTER EXPLANATION */}

          {calculation.billCount > 0 && (

            <div className="visualizer-perspective">

              <span className="visualizer-perspective-number">

                {
                  calculation.billCount
                }

              </span>


              <p>

                individual ${selectedBill}
                bills make up{" "}

                <strong>

                  {formatMoney(
                    calculation.billCount *
                    selectedBill
                  )}

                </strong>

                .

              </p>

            </div>

          )}

        </section>

      )}



      {/* =========================================
          WORK HOURS
      ========================================= */}

      <section className="perspective-tool-section">

        <div className="perspective-tool-heading">

          <p className="perspective-tool-eyebrow">
            Work Hours
          </p>


          <h2>
            What did this money
            cost you in time?
          </h2>


          <p>
            Enter your approximate
            after-tax hourly pay once.
            Your rate will stay saved
            on this device.
          </p>

        </div>


        <div className="work-hours-card">

          <div className="work-rate-row">

            <div>

              <span className="tool-field-label">
                After-tax hourly pay
              </span>


              <p className="tool-field-help">
                What actually reaches
                your pocket per hour.
              </p>

            </div>


            <div className="hourly-rate-input-shell">

              <span>
                $
              </span>


              <input
                type="text"
                inputMode="decimal"
                value={hourlyRate}
                onChange={
                  handleHourlyRateChange
                }
                placeholder="18.00"
                aria-label="After-tax hourly pay"
              />


              <span className="hourly-rate-suffix">
                / hr
              </span>

            </div>

          </div>



          {numericAmount > 0 &&
          numericHourlyRate > 0 ? (

            <div className="work-hours-result">

              <div className="work-hours-result-copy">

                <span>

                  {formatMoney(
                    numericAmount
                  )}

                </span>


                <strong>

                  {formatWorkTime(
                    workMinutes
                  )}

                </strong>


                <p>
                  of your working time
                </p>

              </div>


              <div className="work-clock">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >

                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />


                  <path
                    d="M12 7v5l3 2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                </svg>

              </div>

            </div>

          ) : (

            <div className="work-hours-placeholder">

              {numericAmount <= 0
                ? "Enter an amount at the top to see its value in work time."
                : "Enter your hourly pay to see how much work this amount represents."}

            </div>

          )}



          {workMinutes > 0 && (

            <div className="work-hours-details">

              <div>

                <span>
                  Hourly pay
                </span>


                <strong>

                  {formatMoney(
                    numericHourlyRate
                  )}

                </strong>

              </div>


              <div>

                <span>
                  Work time
                </span>


                <strong>

                  {formatWorkTime(
                    workMinutes
                  )}

                </strong>

              </div>


              <div>

                <span>
                  8-hour workdays
                </span>


                <strong>
                  {workDays.toFixed(1)}
                </strong>

              </div>

            </div>

          )}

        </div>

      </section>



      {/* =========================================
          WHAT IF PURCHASE SIMULATOR
      ========================================= */}

      <section className="perspective-tool-section">

        <div className="perspective-tool-heading">

          <p className="perspective-tool-eyebrow">
            What If?
          </p>


          <h2>
            See the purchase
            before you make it.
          </h2>


          <p>
            Temporarily place this
            purchase into your month
            and see how the numbers
            change. Nothing here is
            added to your transactions.
          </p>

        </div>


        <div className="purchase-simulator">

          {/* PURCHASE INFORMATION */}

          <div className="purchase-simulator-top">

            <label className="purchase-name-field">

              <span>
                What are you thinking
                about buying?
              </span>


              <input
                type="text"
                value={purchaseName}
                onChange={(event) =>
                  setPurchaseName(
                    event.target.value
                  )
                }
                placeholder="Optional — e.g. Monitor"
              />

            </label>


            <label className="purchase-amount-field">

              <span>
                Purchase price
              </span>


              <div className="purchase-amount-input-shell">

                <span className="purchase-amount-dollar">
                  $
                </span>


                <input
                  type="text"
                  inputMode="decimal"
                  value={purchaseAmount}
                  onChange={
                    handlePurchaseAmountChange
                  }
                  placeholder="0.00"
                  aria-label="Hypothetical purchase price"
                />

              </div>

            </label>

          </div>



          {/* WITHOUT / WITH PURCHASE */}

          <div
            className="simulation-toggle"
            role="group"
            aria-label="Purchase simulation view"
          >

            <button
              type="button"
              className={
                simulationMode ===
                "without"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSimulationMode(
                  "without"
                )
              }
              aria-pressed={
                simulationMode ===
                "without"
              }
            >

              Without purchase

            </button>


            <button
              type="button"
              className={
                simulationMode ===
                "with"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSimulationMode(
                  "with"
                )
              }
              aria-pressed={
                simulationMode ===
                "with"
              }
            >

              With purchase

            </button>

          </div>



          {/* SIMULATION RESULTS */}

          {numericPurchaseAmount > 0 ? (

            <>

              {/* MAIN RESULT */}

              <div
                className={
                  `simulation-hero ${
                    simulationMode ===
                    "with"
                      ? "simulation-hero-with"
                      : ""
                  }`
                }
              >

                <span className="simulation-hero-label">

                  {simulationMode === "with"
                    ? `${
                        purchaseName.trim() ||
                        "This purchase"
                      } included`
                    : "Your current month"}

                </span>


                <strong>

                  {formatMoney(
                    scenarioMonthlySpending
                  )}

                </strong>


                <span className="simulation-hero-subtitle">
                  total spending this month
                </span>

              </div>



              {/* COMPARISON CARDS */}

              <div className="simulation-comparison-grid">

                {/* MONTHLY SPENDING */}

                <div className="simulation-comparison-card">

                  <span>
                    Monthly spending
                  </span>


                  <div className="simulation-arrow-values">

                    <strong>

                      {formatMoney(
                        monthlySpending
                      )}

                    </strong>


                    <span>
                      →
                    </span>


                    <strong>

                      {formatMoney(
                        simulatedMonthlySpending
                      )}

                    </strong>

                  </div>

                </div>



                {/* DAILY AVERAGE */}

                <div className="simulation-comparison-card">

                  <span>
                    Average per day
                  </span>


                  <div className="simulation-arrow-values">

                    <strong>

                      {formatMoney(
                        currentDailyAverage
                      )}

                    </strong>


                    <span>
                      →
                    </span>


                    <strong>

                      {formatMoney(
                        simulatedDailyAverage
                      )}

                    </strong>

                  </div>

                </div>



                {/* CASH EQUIVALENT */}

                <div className="simulation-comparison-card">

                  <span>
                    Cash equivalent
                  </span>


                  <strong className="simulation-single-value">

                    {
                      purchaseCalculation.billCount
                    } × ${selectedBill}

                  </strong>


                  {purchaseCalculation.remainder > 0 && (

                    <small>

                      +{" "}

                      {formatMoney(
                        purchaseCalculation.remainder
                      )}

                    </small>

                  )}

                </div>



                {/* WORK REQUIRED */}

                <div className="simulation-comparison-card">

                  <span>
                    Work required
                  </span>


                  <strong className="simulation-single-value">

                    {numericHourlyRate > 0
                      ? formatWorkTime(
                          purchaseWorkMinutes
                        )
                      : "Add hourly pay above"}

                  </strong>

                </div>

              </div>



              {/* CURRENTLY VIEWING */}

              <div className="simulation-current-value">

                <span>
                  Currently viewing
                </span>


                <strong>

                  {formatMoney(
                    scenarioDailyAverage
                  )}{" "}
                  per day

                </strong>

              </div>



              {/* DISCLAIMER */}

              <p className="simulation-disclaimer">

                This is only a simulation.
                Switching to “With purchase”
                does not save, add, or modify
                any transaction.

              </p>

            </>

          ) : (

            <div className="simulation-empty">

              <strong>
                Enter a purchase amount above
              </strong>


              <p>
                The simulator will compare
                your real month with a version
                where you made that purchase.
              </p>

            </div>

          )}

        </div>

      </section>

    </main>

  );
}