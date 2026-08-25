// =========================================================
// EXPENSE HELPERS
// Shared functions for dates, currency, and summaries.
// =========================================================


// ---------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];


// ---------------------------------------------------------
// CURRENCY
// ---------------------------------------------------------

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
}


// ---------------------------------------------------------
// DATE HELPERS
// ---------------------------------------------------------

// We intentionally parse YYYY-MM-DD manually.
//
// new Date("2026-08-25") can sometimes cause timezone
// weirdness because JavaScript may interpret it as UTC.
//
// This keeps the date in the user's local timezone.
export function parseExpenseDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}


// Converts a Date into the value expected by:
//
// <input type="date" />
//
// Example:
// 2026-08-25
export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ---------------------------------------------------------
// CURRENT MONTH TOTAL
// ---------------------------------------------------------

export function getCurrentMonthTotal(expenses) {
  const now = new Date();

  return expenses.reduce((total, expense) => {
    const date = parseExpenseDate(expense.date);

    if (!date) return total;

    const isCurrentMonth =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth();

    if (!isCurrentMonth) {
      return total;
    }

    return total + Number(expense.amount || 0);
  }, 0);
}


// ---------------------------------------------------------
// CURRENT MONTH TRANSACTION COUNT
// ---------------------------------------------------------

export function getCurrentMonthCount(expenses) {
  const now = new Date();

  return expenses.filter((expense) => {
    const date = parseExpenseDate(expense.date);

    if (!date) return false;

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;
}


// ---------------------------------------------------------
// MONTHLY SNAPSHOTS
// ---------------------------------------------------------

export function buildMonthlySnapshot(expenses, numberOfMonths = 3) {
  const now = new Date();

  const snapshots = [];

  for (let offset = 0; offset < numberOfMonths; offset++) {
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1
    );

    const previousMonthDate = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() - 1,
      1
    );

    const monthExpenses = expenses.filter((expense) => {
      const date = parseExpenseDate(expense.date);

      if (!date) return false;

      return (
        date.getFullYear() === monthDate.getFullYear() &&
        date.getMonth() === monthDate.getMonth()
      );
    });

    const previousMonthExpenses = expenses.filter((expense) => {
      const date = parseExpenseDate(expense.date);

      if (!date) return false;

      return (
        date.getFullYear() === previousMonthDate.getFullYear() &&
        date.getMonth() === previousMonthDate.getMonth()
      );
    });

    const total = monthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

    const previousTotal = previousMonthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );


    // -----------------------------------------------------
    // Find the category with the most spending
    // -----------------------------------------------------

    const categoryTotals = {};

    monthExpenses.forEach((expense) => {
      const category = expense.category || "Other";

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Number(expense.amount || 0);
    });


    let topCategory = null;

    let topCategoryAmount = 0;

    Object.entries(categoryTotals).forEach(([category, amount]) => {
      if (amount > topCategoryAmount) {
        topCategory = category;
        topCategoryAmount = amount;
      }
    });


    // -----------------------------------------------------
    // Difference from previous month
    // -----------------------------------------------------

    let percentageChange = null;

    if (previousTotal > 0) {
      percentageChange =
        ((total - previousTotal) / previousTotal) * 100;
    }


    snapshots.push({
      month: monthDate.toLocaleString("en-US", {
        month: "short",
      }),

      year: monthDate.getFullYear(),

      total,

      transactionCount: monthExpenses.length,

      topCategory,

      percentageChange,
    });
  }

  return snapshots;
}


// ---------------------------------------------------------
// MONDAY START OF WEEK
// ---------------------------------------------------------

export function getStartOfWeek(date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  // JS:
  // Sunday = 0
  // Monday = 1
  //
  // Make Monday the beginning of the week.
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);

  return result;
}


// ---------------------------------------------------------
// WEEKLY SPENDING
// ---------------------------------------------------------

export function buildWeeklySpending(expenses, numberOfWeeks = 12) {
  const currentWeekStart = getStartOfWeek(new Date());

  const weeks = [];

  // Build oldest -> newest because that is how the
  // line chart should be displayed.
  for (
    let offset = numberOfWeeks - 1;
    offset >= 0;
    offset--
  ) {
    const weekStart = new Date(currentWeekStart);

    weekStart.setDate(
      currentWeekStart.getDate() - offset * 7
    );


    const weekEnd = new Date(weekStart);

    weekEnd.setDate(weekEnd.getDate() + 7);


    const total = expenses.reduce((sum, expense) => {
      const date = parseExpenseDate(expense.date);

      if (!date) return sum;

      if (date >= weekStart && date < weekEnd) {
        return sum + Number(expense.amount || 0);
      }

      return sum;
    }, 0);


    weeks.push({
      weekStart,
      total,
    });
  }

  return weeks;
}