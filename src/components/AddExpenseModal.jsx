import {
  useEffect,
  useState,
} from "react";

import {
  EXPENSE_CATEGORIES,
  parseExpenseDate,
  toDateInputValue,
} from "../utils/expenseHelpers";


// The form is mounted fresh every time the modal opens, and
// again when a different expense is edited (key), so its
// fields always start from the right values without an
// effect overwriting what the user is typing.
export default function AddExpenseModal(props) {

  if (!props.isOpen) {
    return null;
  }

  return (
    <ExpenseForm
      key={props.editingExpense?.id ?? "new"}
      {...props}
    />
  );

}


function ExpenseForm({
  onClose,

  // Adding
  onAddExpense,

  // Editing / deleting
  editingExpense,
  onUpdateExpense,
  onDeleteExpense,
}) {

  const [amount, setAmount] =
    useState(() =>
      editingExpense
        ? String(editingExpense.amount ?? "")
        : ""
    );

  const [
    description,
    setDescription,
  ] = useState(
    () => editingExpense?.description || ""
  );

  const [category, setCategory] =
    useState(
      () => editingExpense?.category || "Other"
    );

  // An existing expense with no real date starts empty
  // (never silently "today"), so the user picks the day.
  const [date, setDate] =
    useState(() => {

      if (!editingExpense) {
        return toDateInputValue();
      }

      return parseExpenseDate(editingExpense.date)
        ? editingExpense.date
        : "";

    });

  const [
    covered,
    setCovered,
  ] = useState(
    () => editingExpense?.covered === true
  );

  const [
    dateError,
    setDateError,
  ] = useState(() =>
    editingExpense &&
    !parseExpenseDate(editingExpense.date)
      ? `This expense has no valid date (saved as ${
          JSON.stringify(editingExpense.date ?? "")
        }). Pick the day it happened.`
      : ""
  );


  // ======================================================
  // ARE WE ADDING OR EDITING?
  // ======================================================

  const isEditing =
    Boolean(editingExpense);


  // ======================================================
  // ESCAPE KEY
  // ======================================================

  useEffect(() => {

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

  }, [onClose]);


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


    // The input is `required`, but the Android picker's
    // "Clear" button or a typed value can still leave it
    // empty or invalid. Never save an undated expense.
    if (!parseExpenseDate(date)) {

      setDateError(
        "Pick the date of this expense."
      );

      return;

    }


    const expenseData = {

      amount: numberAmount,

      description:
        description.trim(),

      category,

      date,

      covered,

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
            COVERED
        ================================================= */}

        <label className="field-label">
          Coverage
        </label>


        <button
          type="button"
          className={`covered-option-button ${
            covered
              ? "active"
              : ""
          }`}
          aria-pressed={
            covered
          }
          onClick={() => {

            setCovered(
              (previous) =>
                !previous
            );

          }}
        >

          <span className="covered-option-check">

            {covered
              ? "✓"
              : ""}

          </span>


          <span className="covered-option-copy">

            <strong>
              Covered
            </strong>
            
            {/* 
            <small>
              Mark this if someone else paid for it or it will be reimbursed.
            </small> */}

          </span>

        </button>


        {/* =================================================
            DATE
        ================================================= */}

        <label className="field-label">
          Date
        </label>


        <input
          className="expense-input"
          type="date"
          required
          aria-invalid={Boolean(dateError)}
          aria-describedby={
            dateError
              ? "expense-date-error"
              : undefined
          }
          value={date}
          onChange={(event) => {

            setDate(
              event.target.value
            );

            setDateError("");

          }}
        />


        {dateError && (

          <p
            id="expense-date-error"
            className="expense-form-error"
            role="alert"
          >
            {dateError}
          </p>

        )}


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
