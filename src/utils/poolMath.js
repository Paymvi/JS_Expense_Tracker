// =========================================================
// POOL MATH
//
// Every change to pool money goes through these functions.
// Each one returns { pools } (a new array, nothing mutated)
// or { error } (a message to show; nothing changes), so a
// rejected edit can never leave a half-updated pool behind.
//
// Spending is paid for by contributions, oldest first. Each
// spending record remembers its "fundingSources", so undoing
// or editing it returns exactly that money.
// =========================================================

import { formatCurrency } from "./expenseHelpers.js";


export const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;


export const getPoolBalance = (pool) =>
  roundMoney(
    (pool.contributions || []).reduce(
      (total, item) => total + Number(item.remainingAmount || 0),
      0
    )
  );


export const getAmountUsed = (contribution) =>
  roundMoney(
    Number(contribution.originalAmount || 0) -
      Number(contribution.remainingAmount || 0)
  );


export const byOldestFirst = (a, b) => {
  const aDate = new Date(`${a.date}T00:00:00`).getTime();
  const bDate = new Date(`${b.date}T00:00:00`).getTime();

  if (aDate !== bDate) {
    return aDate - bDate;
  }

  return Number(a.createdAt || 0) - Number(b.createdAt || 0);
};


const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;


const findPool = (pools, id) =>
  pools.find((pool) => pool.id === id);


const replacePool = (pools, next) =>
  pools.map((pool) => (pool.id === next.id ? next : pool));


function cleanFields(fields) {
  const title = String(fields.title || "").trim();
  const amount = roundMoney(fields.amount);

  if (!title) {
    return { error: "Add a short name for this entry." };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter an amount greater than $0.00." };
  }

  if (!fields.date) {
    return { error: "Pick a date." };
  }

  return {
    title,
    amount,
    date: fields.date,
    note: String(fields.note || "").trim(),
  };
}


function getTargetPool(pools, targetId) {
  const target = findPool(pools, targetId);

  if (!target) {
    return { error: "That pool no longer exists." };
  }

  if (target.archivedAt) {
    return { error: "Restore that pool before moving entries into it." };
  }

  return { target };
}


// Takes `amount` from the oldest available contributions.
// Returns null when the pool does not have enough.
function allocate(contributions, amount) {
  let left = amount;
  const taken = new Map();
  const fundingSources = [];

  const available = contributions
    .filter((item) => Number(item.remainingAmount) > 0)
    .sort(byOldestFirst);

  for (const item of available) {
    if (left <= 0) {
      break;
    }

    const take = roundMoney(Math.min(Number(item.remainingAmount), left));

    taken.set(item.id, roundMoney(Number(item.remainingAmount) - take));
    left = roundMoney(left - take);

    fundingSources.push({
      contributionId: item.id,
      title: item.title,
      type: item.type,
      amount: take,
    });
  }

  if (left > 0) {
    return null;
  }

  return {
    fundingSources,
    contributions: contributions.map((item) =>
      taken.has(item.id)
        ? { ...item, remainingAmount: taken.get(item.id) }
        : item
    ),
  };
}


// Gives back the money a spending record took.
function release(contributions, record) {
  return contributions.map((item) => {
    const returned = (record.fundingSources || [])
      .filter((source) => source.contributionId === item.id)
      .reduce((total, source) => total + Number(source.amount || 0), 0);

    return returned
      ? {
          ...item,
          remainingAmount: roundMoney(
            Number(item.remainingAmount || 0) + returned
          ),
        }
      : item;
  });
}


// ---------------------------------------------------------
// CONTRIBUTIONS (money added to a pool)
// ---------------------------------------------------------

export function addContribution(pools, poolId, fields) {
  const clean = cleanFields(fields);

  if (clean.error) {
    return clean;
  }

  const { target, error } = getTargetPool(pools, poolId);

  if (error) {
    return { error };
  }

  const contribution = {
    id: createId(),
    title: clean.title,
    type: fields.type || "other",
    originalAmount: clean.amount,
    remainingAmount: clean.amount,
    date: clean.date,
    note: clean.note,
    createdAt: Date.now(),
  };

  return {
    pools: replacePool(pools, {
      ...target,
      contributions: [...(target.contributions || []), contribution],
    }),
  };
}


export function updateContribution(pools, poolId, id, fields) {
  const clean = cleanFields(fields);

  if (clean.error) {
    return clean;
  }

  const source = findPool(pools, poolId);
  const old = source?.contributions?.find((item) => item.id === id);

  if (!old) {
    return { error: "This entry no longer exists." };
  }

  const used = getAmountUsed(old);
  const targetId = fields.poolId || poolId;

  if (clean.amount < used) {
    return {
      error: `${formatCurrency(used)} of this money already paid for spending, so the amount can't be lower than that. Undo or edit that spending first.`,
    };
  }

  if (targetId !== poolId && used > 0) {
    return {
      error: "Some of this money already paid for spending in this pool, so it can't move. Undo that spending first.",
    };
  }

  const updated = {
    ...old,
    title: clean.title,
    type: fields.type || old.type,
    date: clean.date,
    note: clean.note,
    originalAmount: clean.amount,
    remainingAmount: roundMoney(clean.amount - used),
  };

  if (targetId === poolId) {
    return {
      pools: replacePool(pools, {
        ...source,
        contributions: source.contributions.map((item) =>
          item.id === id ? updated : item
        ),
        // "Funded by" keeps a copy of the title; keep it in step.
        spending: (source.spending || []).map((record) => ({
          ...record,
          fundingSources: (record.fundingSources || []).map((item) =>
            item.contributionId === id
              ? { ...item, title: updated.title, type: updated.type }
              : item
          ),
        })),
      }),
    };
  }

  const { target, error } = getTargetPool(pools, targetId);

  if (error) {
    return { error };
  }

  const withoutOld = replacePool(pools, {
    ...source,
    contributions: source.contributions.filter((item) => item.id !== id),
  });

  return {
    pools: replacePool(withoutOld, {
      ...target,
      contributions: [...(target.contributions || []), updated],
    }),
  };
}


export function deleteContribution(pools, poolId, id) {
  const pool = findPool(pools, poolId);
  const old = pool?.contributions?.find((item) => item.id === id);

  if (!old) {
    return { error: "This entry no longer exists." };
  }

  if (getAmountUsed(old) > 0) {
    return {
      error: "This money already paid for spending, so it can't be deleted. Undo that spending first.",
    };
  }

  return {
    pools: replacePool(pools, {
      ...pool,
      contributions: pool.contributions.filter((item) => item.id !== id),
    }),
  };
}


// ---------------------------------------------------------
// SPENDING (money used from a pool)
// ---------------------------------------------------------

export function addSpending(pools, poolId, fields) {
  const clean = cleanFields(fields);

  if (clean.error) {
    return clean;
  }

  const { target, error } = getTargetPool(pools, poolId);

  if (error) {
    return { error };
  }

  const funded = allocate(target.contributions || [], clean.amount);

  if (!funded) {
    return {
      error: `This pool only has ${formatCurrency(getPoolBalance(target))} available.`,
    };
  }

  const record = {
    id: createId(),
    title: clean.title,
    amount: clean.amount,
    date: clean.date,
    note: clean.note,
    fundingSources: funded.fundingSources,
    createdAt: Date.now(),
  };

  return {
    pools: replacePool(pools, {
      ...target,
      contributions: funded.contributions,
      spending: [...(target.spending || []), record],
    }),
  };
}


export function updateSpending(pools, poolId, id, fields) {
  const clean = cleanFields(fields);

  if (clean.error) {
    return clean;
  }

  const source = findPool(pools, poolId);
  const old = source?.spending?.find((item) => item.id === id);

  if (!old) {
    return { error: "This entry no longer exists." };
  }

  const targetId = fields.poolId || poolId;
  const samePool = targetId === poolId;

  const base = {
    ...old,
    title: clean.title,
    date: clean.date,
    note: clean.note,
  };

  // Text/date-only edits keep the original "Funded by" split.
  if (samePool && clean.amount === roundMoney(old.amount)) {
    return {
      pools: replacePool(pools, {
        ...source,
        spending: source.spending.map((item) =>
          item.id === id ? base : item
        ),
      }),
    };
  }

  // Amount or pool changed: give the old funding back, then
  // fund the corrected amount again (oldest money first).
  const released = replacePool(pools, {
    ...source,
    contributions: release(source.contributions || [], old),
    spending: samePool
      ? source.spending
      : source.spending.filter((item) => item.id !== id),
  });

  const { target, error } = getTargetPool(released, targetId);

  if (error) {
    return { error };
  }

  const funded = allocate(target.contributions || [], clean.amount);

  if (!funded) {
    return {
      error: `${target.name} only has ${formatCurrency(getPoolBalance(target))} available for this.`,
    };
  }

  const record = {
    ...base,
    amount: clean.amount,
    fundingSources: funded.fundingSources,
  };

  return {
    pools: replacePool(released, {
      ...target,
      contributions: funded.contributions,
      spending: samePool
        ? target.spending.map((item) => (item.id === id ? record : item))
        : [...(target.spending || []), record],
    }),
  };
}


export function deleteSpending(pools, poolId, id) {
  const pool = findPool(pools, poolId);
  const old = pool?.spending?.find((item) => item.id === id);

  if (!old) {
    return { error: "This entry no longer exists." };
  }

  return {
    pools: replacePool(pools, {
      ...pool,
      contributions: release(pool.contributions || [], old),
      spending: pool.spending.filter((item) => item.id !== id),
    }),
  };
}


// ---------------------------------------------------------
// POOLS
// ---------------------------------------------------------

export function updatePool(pools, id, fields) {
  const name = String(fields.name || "").trim();

  if (!name) {
    return { error: "Give the pool a name." };
  }

  const pool = findPool(pools, id);

  if (!pool) {
    return { error: "That pool no longer exists." };
  }

  return {
    pools: replacePool(pools, {
      ...pool,
      name,
      description: String(fields.description || "").trim(),
    }),
  };
}
