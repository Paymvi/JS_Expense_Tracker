import React, {
  useEffect,
  useState,
} from "react";

import {
  EXPENSE_CATEGORIES,
  toDateInputValue,
} from "../utils/expenseHelpers";


export default function AddExpenseModal({
  isOpen,
  onClose,
  onAddExpense,
}) {

  const [amount, setAmount] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [category, setCategory] =
    useState("Other");

  const [date, setDate] =
    useState(
      toDateInputValue()
    );


  // ======================================================
  // RESET WHEN MODAL OPENS
  // ======================================================

  useEffect(() => {

    if (!isOpen) {
      return;
    }


    setAmount("");

    setDescription("");

    setCategory("Other");

    setDate(
      toDateInputValue()
    );

  }, [isOpen]);


  // ======================================================
  // ESCAPE KEY
  // ======================================================

  useEffect(() => {

    if (!isOpen) {
      return;
    }


    function handleKeyDown(event) {

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

  }, [isOpen, onClose]);


  // Don't render anything while closed.
  if (!isOpen) {
    return null;
  }


  // ======================================================
  // ADD EXPENSE
  // ======================================================

  function handleSubmit(event) {

    event.preventDefault();


    const numberAmount =
      Number(amount);


    if (
      !numberAmount ||
      numberAmount <= 0
    ) {
      return;
    }


    onAddExpense({
      amount: numberAmount,

      description:
        description.trim(),

      category,

      date,
    });


    onClose();
  }


  return (

    <div
      className="modal-backdrop"
      onMouseDown={(event) => {

        // Only close if the actual
        // dark backdrop is clicked.
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }

      }}
    >

      <form
        className="expense-modal"
        onSubmit={handleSubmit}
      >

        <div className="modal-header">

          <div>

            <div className="modal-eyebrow">
              New expense
            </div>

            <h2>
              What did you spend?
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


        {/* AMOUNT */}

        <label className="field-label">
          Amount
        </label>


        <div className="amount-field">

          <span>
            $
          </span>

          <input
            autoFocus
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => {
              setAmount(
                event.target.value
              );
            }}
          />

        </div>


        {/* DESCRIPTION */}

        <label className="field-label">
          What was it?
        </label>


        <input
          className="expense-input"
          type="text"
          placeholder="Chipotle, gas, groceries..."
          value={description}
          onChange={(event) => {
            setDescription(
              event.target.value
            );
          }}
        />


        {/* CATEGORY TAGS */}

        <label className="field-label">
          Category
        </label>


        <div className="category-chips">

          {EXPENSE_CATEGORIES.map(
            (option) => (

              <button
                key={option}
                type="button"
                className={`category-chip ${
                  category === option
                    ? "active"
                    : ""
                }`}
                aria-pressed={
                  category === option
                }
                onClick={() => {
                  setCategory(
                    option
                  );
                }}
              >
                {option}
              </button>

            )
          )}

        </div>


        {/* DATE */}

        <label className="field-label">
          Date
        </label>


        <input
          className="expense-input"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(
              event.target.value
            );
          }}
        />


        {/* BUTTONS */}

        <div className="modal-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>


          <button
            type="submit"
            className="primary-button"
          >
            Add expense
          </button>

        </div>

      </form>

    </div>
  );
}