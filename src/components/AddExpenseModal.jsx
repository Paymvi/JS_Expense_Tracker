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

  // Adding
  onAddExpense,

  // Editing / deleting
  editingExpense,
  onUpdateExpense,
  onDeleteExpense,
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
  // ARE WE ADDING OR EDITING?
  // ======================================================

  const isEditing =
    Boolean(editingExpense);


  // ======================================================
  // LOAD FORM VALUES
  // ======================================================

  useEffect(() => {

    if (!isOpen) {
      return;
    }


    // -----------------------------------------------
    // EDIT EXISTING EXPENSE
    // -----------------------------------------------

    if (editingExpense) {

      setAmount(
        String(
          editingExpense.amount ?? ""
        )
      );

      setDescription(
        editingExpense.description || ""
      );

      setCategory(
        editingExpense.category || "Other"
      );

      setDate(
        editingExpense.date ||
          toDateInputValue()
      );

      return;
    }


    // -----------------------------------------------
    // ADD NEW EXPENSE
    // -----------------------------------------------

    setAmount("");

    setDescription("");

    setCategory("Other");

    setDate(
      toDateInputValue()
    );

  }, [
    isOpen,
    editingExpense,
  ]);


  // ======================================================
  // ESCAPE KEY
  // ======================================================

  useEffect(() => {

    if (!isOpen) {
      return;
    }


    function handleKeyDown(event) {

      if (
        event.key === "Escape"
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


  // Don't render modal while closed.
  if (!isOpen) {
    return null;
  }


  // ======================================================
  // SUBMIT
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


    const expenseData = {

      amount: numberAmount,

      description:
        description.trim(),

      category,

      date,

    };


    // -----------------------------------------------
    // EDIT
    // -----------------------------------------------

    if (isEditing) {

      onUpdateExpense(
        editingExpense.id,
        expenseData
      );

      onClose();

      return;
    }


    // -----------------------------------------------
    // ADD
    // -----------------------------------------------

    onAddExpense(
      expenseData
    );

    onClose();
  }


  // ======================================================
  // DELETE
  // ======================================================

  function handleDelete() {

    if (!editingExpense) {
      return;
    }


    const shouldDelete =
      window.confirm(
        `Delete ${
          editingExpense.description ||
          "this expense"
        }?`
      );


    if (!shouldDelete) {
      return;
    }


    onDeleteExpense(
      editingExpense.id
    );


    onClose();
  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <div
      className="modal-backdrop"
      onMouseDown={(event) => {

        // Only close if the user clicked
        // the backdrop itself.
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

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="modal-header">

          <div>

            <div className="modal-eyebrow">

              {isEditing
                ? "Transaction"
                : "New expense"}

            </div>


            <h2>

              {isEditing
                ? "Edit expense"
                : "What did you spend?"}

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
            AMOUNT
        ================================================= */}

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


        {/* =================================================
            DESCRIPTION
        ================================================= */}

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


        {/* =================================================
            CATEGORY
        ================================================= */}

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


        {/* =================================================
            DATE
        ================================================= */}

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


        {/* =================================================
            BUTTONS
        ================================================= */}

        <div
          className={`modal-actions ${
            isEditing
              ? "modal-actions-edit"
              : ""
          }`}
        >

          {/* Only show DELETE while editing */}

          {isEditing && (

            <button
              type="button"
              className="danger-button"
              onClick={handleDelete}
            >
              Delete
            </button>

          )}


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

            {isEditing
              ? "Save changes"
              : "Add expense"}

          </button>

        </div>

      </form>

    </div>

  );
}