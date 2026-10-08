import {
  useMemo,
  useState,
} from "react";



const BILL_OPTIONS = [
  5,
  10,
  20,
];


export default function VisualizerPage() {

  const [
    amount,
    setAmount,
  ] = useState("");


  const [
    selectedBill,
    setSelectedBill,
  ] = useState(5);



  const numericAmount =
    Number.parseFloat(amount) || 0;



  const calculation = useMemo(() => {

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



  return (

    <main className="visualizer-page">

      {/* =========================================
          HEADER
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



        {/* =========================================
            AMOUNT INPUT
        ========================================= */}

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



        {/* =========================================
            BILL SELECTOR
        ========================================= */}

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
          EMPTY STATE
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
          VISUALIZATION
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

                ${
                  selectedBill
                } {
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

                individual ${
                  selectedBill
                } bills make up

                {" "}

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

    </main>

  );
}