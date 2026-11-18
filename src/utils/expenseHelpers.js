// =========================================================
// EXPENSE HELPERS
// Shared functions for dates, currency, and summaries.
// =========================================================


// ---------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------

export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Transportation",
  "Shopping",
  "Bills",
  "Subscriptions",
  "Entertainment",
  "Gifts",
  "Other",
];


// Groups any category label (including old ones like "Food")
// into the type that picks its icon and color.
//
// Each pattern must start at a word, so "Skincare" is not
// "car" and "Vegas trip" is not "gas". First match wins.
const CATEGORY_PATTERNS = [
  ["groceries", /\bgrocer/],
  ["dining", /\bdining/],
  ["subscriptions", /\bsubscri/],
  ["gifts", /\bgift/],
  // Older entries saved as "Food" keep their look.
  ["food", /\bfood/],
  ["shopping", /\bshop/],
  ["entertainment", /\bentertain/],
  ["transport", /\btransport|\bgas\b|\bcars?\b/],
  ["bills", /\bbills?\b|\butilit(y|ies)\b/],
  ["health", /\bhealth|\bmedical/],
];

export function normalizeCategory(
  category
) {

  const normalized =
    String(
      category || "Other"
    )
      .trim()
      .toLowerCase();

  return (
    CATEGORY_PATTERNS.find(
      ([, pattern]) => pattern.test(normalized)
    )?.[0] ?? "other"
  );

}


// Chart colors, matching the category icon colors in App.css.
const CATEGORY_COLORS = {
  groceries: "#267653",
  food: "#267653",
  dining: "#a8611c",
  transport: "#426d94",
  shopping: "#a54f3e",
  bills: "#947235",
  subscriptions: "#2b7a74",
  entertainment: "#6c4a9d",
  gifts: "#94457f",
  health: "#a64e5e",
  other: "#68756c",
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[normalizeCategory(category)];
}


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
//
// Returns null for anything that is not a real calendar day
// in YYYY-MM-DD form (e.g. "", "2026-1-5" or "2026-02-31"),
// the same rule backup import uses.
export function parseExpenseDate(dateString) {
  const match =
    typeof dateString === "string" &&
    dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [year, month, day] = match.slice(1).map(Number);

  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
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

//
// Every "this month" figure (Overview, Transactions,
// Visualizer) goes through these, so they always agree.
// `now` is passed in so screens refresh after midnight.
// ---------------------------------------------------------

// The expenses that count toward spending totals. "Covered"
// ones (someone else paid) only count when the user's
// "Include covered" switch is on.
export function getSpendingExpenses(expenses, includeCovered) {
  return includeCovered
    ? expenses
    : expenses.filter((expense) => expense.covered !== true);
}

function isInMonthOf(expense, now) {
  const date = parseExpenseDate(expense.date);

  return (
    date !== null &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export function getCurrentMonthTotal(expenses, now = new Date()) {
  return expenses.reduce(
    (total, expense) =>
      isInMonthOf(expense, now)
        ? total + Number(expense.amount || 0)
        : total,
    0
  );
}


// ---------------------------------------------------------
// CURRENT MONTH TRANSACTION COUNT
// ---------------------------------------------------------

export function getCurrentMonthCount(expenses, now = new Date()) {
  return expenses.filter((expense) => isInMonthOf(expense, now)).length;
}


// Average per calendar day of the month so far (today included).
export function getDailyAverage(monthTotal, now = new Date()) {
  return monthTotal / now.getDate();
}


// ---------------------------------------------------------
// CASH BILLS
//
// How many bills of one size make up an amount, and what is
// left over. Works in whole cents so 0.1 + 0.2 style float
// errors never show up as a wrong remainder.
// ---------------------------------------------------------

export function countBills(amount, bill) {
  const cents = Math.round(Number(amount) * 100);
  const billCents = Math.round(Number(bill) * 100);

  if (!(cents > 0) || !(billCents > 0)) {
    return { billCount: 0, remainder: 0 };
  }

  return {
    billCount: Math.floor(cents / billCents),
    remainder: (cents % billCents) / 100,
  };
}


// ---------------------------------------------------------
// MONTHLY SNAPSHOTS
// ---------------------------------------------------------

export function buildMonthlySnapshot(
  expenses,
  numberOfMonths = 3,
  now = new Date()
) {
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

      // January = 0
      // February = 1
      // ...
      // December = 11
      //
      // We keep this because it makes it much easier
      // to find all expenses belonging to this month.
      monthIndex: monthDate.getMonth(),

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

export function buildWeeklySpending(
  expenses,
  numberOfWeeks = 12,
  now = new Date()
) {
  const currentWeekStart = getStartOfWeek(now);

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





// ---------------------------------------------------------
// CATEGORY BREAKDOWN FOR A MONTH
// ---------------------------------------------------------

export function buildCategoryBreakdown(
  expenses,
  year,
  monthIndex
) {

  // ======================================================
  // FIND EXPENSES FROM THE SELECTED MONTH
  // ======================================================

  const monthExpenses =
    expenses.filter((expense) => {

      const date =
        parseExpenseDate(
          expense.date
        );


      if (!date) {
        return false;
      }


      return (
        date.getFullYear() === year &&
        date.getMonth() === monthIndex
      );

    });


  // ======================================================
  // TOTAL SPENDING
  // ======================================================

  const totalSpent =
    monthExpenses.reduce(
      (total, expense) => {

        return (
          total +
          Number(
            expense.amount || 0
          )
        );

      },
      0
    );


  // ======================================================
  // ADD UP EACH CATEGORY
  // ======================================================

  const categoryTotals = {};


  monthExpenses.forEach(
    (expense) => {

      const category =
        expense.category ||
        "Other";


      categoryTotals[category] =
        (
          categoryTotals[
            category
          ] || 0
        ) +
        Number(
          expense.amount || 0
        );

    }
  );


  // ======================================================
  // CONVERT OBJECT INTO ARRAY
  // ======================================================

  const categories =
    Object.entries(
      categoryTotals
    )
      .map(
        ([category, amount]) => {

          const percentage =
            totalSpent > 0
              ? (
                  amount /
                  totalSpent
                ) * 100
              : 0;


          return {

            category,

            amount,

            percentage,

          };

        }
      )


      // Highest spending category first.
      .sort(
        (a, b) =>
          b.amount -
          a.amount
      );


  // ======================================================
  // RETURN EVERYTHING
  // ======================================================

  return {

    totalSpent,

    transactionCount:
      monthExpenses.length,

    categories,

  };
}