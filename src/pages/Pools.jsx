import { useEffect, useMemo, useState } from "react";

import { getPools, savePools } from "../data/poolsRepository";
import { formatCurrency as formatMoney } from "../utils/expenseHelpers";
import {
  addContribution,
  addSpending,
  byOldestFirst,
  deleteContribution,
  deleteSpending,
  getAmountUsed,
  getPoolBalance,
  updateContribution,
  updatePool,
  updateSpending,
} from "../utils/poolMath";

const CONTRIBUTION_TYPES = [
  { value: "skipped", label: "Skipped purchase" },
  { value: "discount", label: "Sale / discount" },
  { value: "cheaper", label: "Bought cheaper option" },
  { value: "refund", label: "Refund" },
  { value: "coupon", label: "Coupon / promo" },
  { value: "extra", label: "Extra money" },
  { value: "other", label: "Other" },
];

const createId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getTodayInputValue = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getContributionLabel = (type) => {
  return (
    CONTRIBUTION_TYPES.find((item) => item.value === type)?.label || "Other"
  );
};

const getSourceIcon = (type) =>
  ({ discount: "%", refund: "↩", skipped: "×" })[type] || "$";

const hasHistory = (pool) =>
  (pool.contributions || []).length > 0 || (pool.spending || []).length > 0;

const sumBy = (list, key) =>
  list.reduce((total, item) => total + Number(item[key] || 0), 0);

const loadPools = () => {
  try {
    const parsed = getPools();

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("Could not load money pools:", error);
    return [];
  }
};

const NO_POOL = { contributions: [], spending: [] };

const pickDefaultPool = (pools) =>
  (pools.find((pool) => !pool.archivedAt) || pools[0])?.id || null;

function Pools() {
  const [pools, setPools] = useState(loadPools);

  const [selectedPoolId, setSelectedPoolId] = useState(() =>
    pickDefaultPool(loadPools())
  );

  const [activeTab, setActiveTab] = useState("money");
  const [showHelp, setShowHelp] = useState(false);

  // null = closed. { id } present = editing an existing pool.
  const [poolForm, setPoolForm] = useState(null);

  // null = closed. kind: "contribution" | "spending".
  // id present = editing an existing entry.
  const [entryForm, setEntryForm] = useState(null);

  useEffect(() => {
    try {
      savePools(pools);
    } catch (error) {
      console.error("Could not save money pools:", error);
    }
  }, [pools]);

  const activePools = useMemo(
    () => pools.filter((pool) => !pool.archivedAt),
    [pools]
  );

  const archivedPools = useMemo(
    () => pools.filter((pool) => pool.archivedAt),
    [pools]
  );

  // Falls back to the first active pool when the selected one
  // was archived or deleted.
  const selectedPool = useMemo(() => {
    const fallbackId = pickDefaultPool(pools);

    return (
      pools.find((pool) => pool.id === selectedPoolId) ||
      pools.find((pool) => pool.id === fallbackId) ||
      null
    );
  }, [pools, selectedPoolId]);

  const totals = useMemo(() => {
    return {
      available: activePools.reduce(
        (total, pool) => total + getPoolBalance(pool),
        0
      ),
      added: activePools.reduce(
        (total, pool) => total + sumBy(pool.contributions || [], "originalAmount"),
        0
      ),
      spent: activePools.reduce(
        (total, pool) => total + sumBy(pool.spending || [], "amount"),
        0
      ),
    };
  }, [activePools]);

  // Never null: the React Compiler drops `?.` when it turns
  // `shownPool.x` into a memo dependency check.
  const shownPool = selectedPool || NO_POOL;

  const availableContributions = useMemo(() => {
    return (shownPool.contributions || [])
      .filter((item) => Number(item.remainingAmount) > 0)
      .sort(byOldestFirst);
  }, [shownPool]);

  const usedContributions = useMemo(() => {
    return (shownPool.contributions || [])
      .filter((item) => Number(item.remainingAmount) <= 0)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }, [shownPool]);

  const spendingHistory = useMemo(() => {
    return [...(shownPool.spending || [])].sort(
      (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
    );
  }, [shownPool]);

  // Applies a poolMath result, or keeps the form open with
  // the message so the typed values are not lost.
  const commit = (result, setForm) => {
    if (result.error) {
      setForm((current) => current && { ...current, error: result.error });
      return false;
    }

    setPools(result.pools);
    setForm(null);
    return true;
  };

  // ---------------------------------------------------------
  // POOL FORM
  // ---------------------------------------------------------

  const openNewPool = () =>
    setPoolForm({ name: "", description: "", error: "" });

  const openEditPool = () =>
    setPoolForm({
      id: shownPool.id,
      name: shownPool.name,
      description: shownPool.description || "",
      error: "",
    });

  const handleSavePool = (event) => {
    event.preventDefault();

    if (poolForm.id) {
      commit(updatePool(pools, poolForm.id, poolForm), setPoolForm);
      return;
    }

    const name = poolForm.name.trim();

    if (!name) {
      setPoolForm({ ...poolForm, error: "Give the pool a name." });
      return;
    }

    const newPool = {
      id: createId(),
      name,
      description: poolForm.description.trim(),
      createdAt: Date.now(),
      contributions: [],
      spending: [],
    };

    setPools((current) => [...current, newPool]);
    setSelectedPoolId(newPool.id);
    setPoolForm(null);
  };

  const setArchived = (pool, archived) => {

    if (
      archived &&
      !window.confirm(
        `Archive "${pool.name}"? It will be hidden from your list and left out of the totals. All of its history is kept, and you can restore it any time.`
      )
    ) {
      return;
    }

    setPools((current) =>
      current.map((item) =>
        item.id === pool.id
          ? { ...item, archivedAt: archived ? Date.now() : undefined }
          : item
      )
    );

    if (archived) {
      setSelectedPoolId(null);
    }

    setPoolForm(null);
  };

  const handleDeletePool = (pool) => {

    const entries =
      (pool.contributions || []).length + (pool.spending || []).length;

    const message = entries
      ? `Permanently delete "${pool.name}" and its ${entries} ${
          entries === 1 ? "entry" : "entries"
        }? This can't be undone. Export a backup first if you might need this history.`
      : `Delete "${pool.name}"?`;

    if (!window.confirm(message)) {
      return;
    }

    setPools((current) => current.filter((item) => item.id !== pool.id));
    setPoolForm(null);
  };

  // ---------------------------------------------------------
  // ENTRY FORM (money in / spending)
  // ---------------------------------------------------------

  const openNewEntry = (kind) =>
    setEntryForm({
      kind,
      poolId: shownPool.id,
      title: "",
      amount: "",
      type: "skipped",
      date: getTodayInputValue(),
      note: "",
      error: "",
    });

  const openEditEntry = (kind, entry) =>
    setEntryForm({
      kind,
      id: entry.id,
      poolId: shownPool.id,
      title: entry.title || "",
      amount: String(
        kind === "contribution" ? entry.originalAmount : entry.amount
      ),
      type: entry.type || "other",
      date: entry.date || getTodayInputValue(),
      note: entry.note || "",
      error: "",
    });

  const updateEntryField = (field) => (event) =>
    setEntryForm((current) => ({
      ...current,
      [field]: event.target.value,
      error: "",
    }));

  const handleSaveEntry = (event) => {
    event.preventDefault();

    const { kind, id } = entryForm;
    const poolId = shownPool.id;

    const result =
      kind === "contribution"
        ? id
          ? updateContribution(pools, poolId, id, entryForm)
          : addContribution(pools, poolId, entryForm)
        : id
          ? updateSpending(pools, poolId, id, entryForm)
          : addSpending(pools, poolId, entryForm);

    if (commit(result, setEntryForm) && entryForm.poolId !== poolId) {
      setSelectedPoolId(entryForm.poolId);
    }
  };

  const handleRemoveEntry = () => {
    const { kind, id } = entryForm;
    const entry = (shownPool[kind === "contribution" ? "contributions" : "spending"] || [])
      .find((item) => item.id === id);

    if (!entry) {
      setEntryForm(null);
      return;
    }

    const message =
      kind === "contribution"
        ? `Delete "${entry.title}"? ${formatMoney(entry.originalAmount)} will be removed from this pool.`
        : `Undo "${entry.title}"? ${formatMoney(entry.amount)} goes back to the money that paid for it.`;

    if (!window.confirm(message)) {
      return;
    }

    commit(
      kind === "contribution"
        ? deleteContribution(pools, shownPool.id, id)
        : deleteSpending(pools, shownPool.id, id),
      setEntryForm
    );
  };

  // Money the spending form can use: the pool balance plus
  // (when editing in place) what this entry already holds.
  const editingEntry =
    entryForm?.id && selectedPool
      ? (entryForm.kind === "contribution"
          ? shownPool.contributions
          : shownPool.spending
        )?.find((item) => item.id === entryForm.id)
      : null;

  const spendTargetPool =
    entryForm?.kind === "spending"
      ? pools.find((pool) => pool.id === entryForm.poolId)
      : null;

  const spendAvailable = spendTargetPool
    ? getPoolBalance(spendTargetPool) +
      (editingEntry && entryForm.poolId === shownPool.id
        ? Number(editingEntry.amount || 0)
        : 0)
    : 0;

  const usedAmount =
    entryForm?.kind === "contribution" && editingEntry
      ? getAmountUsed(editingEntry)
      : 0;

  const isArchived = Boolean(shownPool.archivedAt);

  const renderPoolRow = (pool) => (
    <button
      type="button"
      key={pool.id}
      className={`pools-pool-option ${
        pool.id === shownPool.id ? "is-active" : ""
      }`}
      aria-pressed={pool.id === shownPool.id}
      onClick={() => setSelectedPoolId(pool.id)}
    >
      <span className="pools-pool-option-name">{pool.name}</span>

      <span className="pools-pool-option-balance">
        {formatMoney(getPoolBalance(pool))}
      </span>
    </button>
  );

  return (
    <main className="pools-page">
      <div className="pools-shell">
        <header className="pools-page-header">
          <div className="pools-title-row">
            <h1>Pools</h1>

            <button
              type="button"
              className="pools-help-button"
              onClick={() => setShowHelp(true)}
              aria-label="How pools work"
            >
              <span aria-hidden="true">?</span>
            </button>
          </div>

          <button
            type="button"
            className="pools-primary-button"
            onClick={openNewPool}
          >
            <span className="pools-button-icon" aria-hidden="true">+</span>
            New pool
          </button>
        </header>

        {activePools.length > 0 && (
          <details className="pools-summary">
            <summary>
              <span className="pools-summary-label">Available</span>

              <strong className="pools-summary-value">
                {formatMoney(totals.available)}
              </strong>

              <span className="pools-summary-count">
                {activePools.length}{" "}
                {activePools.length === 1 ? "pool" : "pools"}
              </span>

              <span className="pools-summary-more">More</span>
            </summary>

            <dl className="pools-summary-details">
              <div>
                <dt>Added all-time</dt>
                <dd>{formatMoney(totals.added)}</dd>
              </div>

              <div>
                <dt>Spent from pools</dt>
                <dd>{formatMoney(totals.spent)}</dd>
              </div>
            </dl>
          </details>
        )}

        {pools.length === 0 ? (
          <section className="pools-empty-state">
            <h2>No pools yet</h2>

            <p>
              Create a pool, then add money you kept by skipping a
              purchase, getting a discount, or a refund.
            </p>

            <button
              type="button"
              className="pools-primary-button"
              onClick={openNewPool}
            >
              Create your first pool
            </button>
          </section>
        ) : (
          <div className="pools-layout">
            <aside className="pools-sidebar">
              {activePools.length > 0 && (
                <div className="pools-pool-list">
                  {activePools.map(renderPoolRow)}
                </div>
              )}

              {archivedPools.length > 0 && (
                <details className="pools-archived" open={activePools.length === 0}>
                  <summary>Archived ({archivedPools.length})</summary>

                  <div className="pools-pool-list">
                    {archivedPools.map(renderPoolRow)}
                  </div>
                </details>
              )}
            </aside>

            {selectedPool && (
              <section className="pools-detail">
                <div className="pools-detail-header">
                  <div className="pools-detail-title">
                    <h2>{shownPool.name}</h2>

                    {isArchived && (
                      <span className="pools-archived-badge">Archived</span>
                    )}

                    {shownPool.description && (
                      <p className="pools-detail-description">
                        {shownPool.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="pools-text-button"
                    onClick={openEditPool}
                    aria-label={`Edit pool ${shownPool.name}`}
                  >
                    Edit
                  </button>
                </div>

                <div className="pools-balance-card">
                  <div>
                    <span className="pools-balance-label">Available</span>

                    <div className="pools-balance">
                      {formatMoney(getPoolBalance(shownPool))}
                    </div>
                  </div>

                  {!isArchived && (
                    <div className="pools-balance-actions">
                      <button
                        type="button"
                        className="pools-add-button"
                        onClick={() => openNewEntry("contribution")}
                      >
                        <span aria-hidden="true">+</span>
                        Add money
                      </button>

                      <button
                        type="button"
                        className="pools-spend-button"
                        disabled={getPoolBalance(shownPool) <= 0}
                        onClick={() => openNewEntry("spending")}
                      >
                        Spend
                      </button>
                    </div>
                  )}
                </div>

                <div className="pools-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "money"}
                    className={activeTab === "money" ? "is-active" : ""}
                    onClick={() => setActiveTab("money")}
                  >
                    Money in ({(shownPool.contributions || []).length})
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "spending"}
                    className={activeTab === "spending" ? "is-active" : ""}
                    onClick={() => setActiveTab("spending")}
                  >
                    Spent ({spendingHistory.length})
                  </button>
                </div>

                {activeTab === "money" && (
                  <div className="pools-tab-content">
                    {availableContributions.length === 0 &&
                      usedContributions.length === 0 && (
                        <p className="pools-inner-empty">
                          Nothing here yet. Use <strong>Add money</strong>{" "}
                          the next time you skip a purchase or save money.
                        </p>
                      )}

                    {availableContributions.length > 0 && (
                      <div className="pools-source-list">
                        {availableContributions.map((contribution) => {
                          const amountUsed = getAmountUsed(contribution);

                          return (
                            <article
                              key={contribution.id}
                              className="pools-source-card"
                            >
                              <div className="pools-source-card-top">
                                <div className="pools-source-icon" aria-hidden="true">
                                  {getSourceIcon(contribution.type)}
                                </div>

                                <div className="pools-source-main">
                                  <h4>{contribution.title}</h4>

                                  <div className="pools-source-meta">
                                    {getContributionLabel(contribution.type)} ·{" "}
                                    {formatDate(contribution.date)}
                                  </div>

                                  {contribution.note && (
                                    <p className="pools-source-note">
                                      {contribution.note}
                                    </p>
                                  )}
                                </div>

                                <div className="pools-source-money">
                                  <strong>
                                    {formatMoney(contribution.remainingAmount)}
                                  </strong>

                                  {amountUsed > 0 && (
                                    <span>
                                      of {formatMoney(contribution.originalAmount)}
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    className="pools-text-button"
                                    onClick={() =>
                                      openEditEntry("contribution", contribution)
                                    }
                                    aria-label={`Edit ${contribution.title}`}
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}

                    {usedContributions.length > 0 && (
                      <div className="pools-used-section">
                        <h3 className="pools-small-heading">Fully used</h3>

                        <div className="pools-used-list">
                          {usedContributions.map((contribution) => (
                            <div
                              key={contribution.id}
                              className="pools-used-row"
                            >
                              <div>
                                <strong>{contribution.title}</strong>

                                <span>
                                  {formatMoney(contribution.originalAmount)} ·{" "}
                                  {formatDate(contribution.date)}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="pools-text-button"
                                onClick={() =>
                                  openEditEntry("contribution", contribution)
                                }
                                aria-label={`Edit ${contribution.title}`}
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "spending" && (
                  <div className="pools-tab-content">
                    {spendingHistory.length === 0 ? (
                      <p className="pools-inner-empty">
                        No spending from this pool yet.
                      </p>
                    ) : (
                      <div className="pools-spending-list">
                        {spendingHistory.map((transaction) => (
                          <article
                            key={transaction.id}
                            className="pools-spending-card"
                          >
                            <div className="pools-spending-header">
                              <div>
                                <h4>{transaction.title}</h4>

                                <span className="pools-spending-date">
                                  {formatDate(transaction.date)}
                                </span>

                                {transaction.note && <p>{transaction.note}</p>}
                              </div>

                              <div className="pools-spending-side">
                                <span className="pools-spending-amount">
                                  -{formatMoney(transaction.amount)}
                                </span>

                                <button
                                  type="button"
                                  className="pools-text-button"
                                  onClick={() =>
                                    openEditEntry("spending", transaction)
                                  }
                                  aria-label={`Edit ${transaction.title}`}
                                >
                                  Edit
                                </button>
                              </div>
                            </div>

                            {transaction.fundingSources?.length > 0 && (
                              <details className="pools-funded-by">
                                <summary>
                                  Funded by {transaction.fundingSources.length}{" "}
                                  {transaction.fundingSources.length === 1
                                    ? "entry"
                                    : "entries"}
                                </summary>

                                <div className="pools-funding-list">
                                  {transaction.fundingSources.map(
                                    (source, index) => (
                                      <div
                                        className="pools-funding-row"
                                        key={`${transaction.id}-${source.contributionId}-${index}`}
                                      >
                                        <span>{source.title}</span>

                                        <strong>
                                          {formatMoney(source.amount)}
                                        </strong>
                                      </div>
                                    )
                                  )}
                                </div>
                              </details>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {showHelp && (
        <div
          className="pools-modal-backdrop"
          onMouseDown={() => setShowHelp(false)}
        >
          <div
            className="pools-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pools-help-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="pools-modal-heading">
              <h2 id="pools-help-title">How pools work</h2>

              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <ul className="pools-help-list">
              <li>
                A pool is a bucket for money you kept: a skipped purchase,
                a discount, a refund, or extra money.
              </li>
              <li>
                <strong>Add money</strong> records each amount and where
                it came from.
              </li>
              <li>
                <strong>Spend</strong> uses the oldest money first. Whatever
                isn&apos;t needed from an entry stays available.
              </li>
              <li>
                Balances are calculated from entries, so you can&apos;t type
                one in. To fix a balance, tap <strong>Edit</strong> on the
                entry that&apos;s wrong.
              </li>
              <li>
                Pools are separate from your expenses. Spending from a pool
                doesn&apos;t add an expense.
              </li>
              <li>
                Archiving a pool hides it but keeps its history. Pools are
                saved on this device and included in backups.
              </li>
            </ul>

            <div className="pools-modal-actions">
              <button
                type="button"
                className="pools-primary-button"
                onClick={() => setShowHelp(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {poolForm && (
        <div
          className="pools-modal-backdrop"
          onMouseDown={() => setPoolForm(null)}
        >
          <div
            className="pools-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pools-pool-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="pools-modal-heading">
              <h2 id="pools-pool-form-title">
                {poolForm.id ? "Edit pool" : "New pool"}
              </h2>

              <button
                type="button"
                onClick={() => setPoolForm(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePool} noValidate>
              <label className="pools-field">
                <span>Pool name</span>

                <input
                  type="text"
                  value={poolForm.name}
                  onChange={(event) =>
                    setPoolForm({ ...poolForm, name: event.target.value, error: "" })
                  }
                  placeholder="e.g. Fun Money"
                  autoFocus={!poolForm.id}
                />
              </label>

              <label className="pools-field">
                <span>
                  Description <small>optional</small>
                </span>

                <textarea
                  value={poolForm.description}
                  onChange={(event) =>
                    setPoolForm({ ...poolForm, description: event.target.value })
                  }
                  placeholder="What is this money for?"
                  rows={2}
                />
              </label>

              {poolForm.error && (
                <p className="pools-form-error" role="alert">
                  {poolForm.error}
                </p>
              )}

              <div className="pools-modal-actions">
                <button
                  type="button"
                  className="pools-secondary-button"
                  onClick={() => setPoolForm(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="pools-primary-button">
                  {poolForm.id ? "Save" : "Create pool"}
                </button>
              </div>
            </form>

            {poolForm.id && (() => {
              const pool = pools.find((item) => item.id === poolForm.id);

              if (!pool) {
                return null;
              }

              return (
                <div className="pools-danger-zone">
                  {pool.archivedAt ? (
                    <>
                      <button
                        type="button"
                        className="pools-secondary-button"
                        onClick={() => setArchived(pool, false)}
                      >
                        Restore pool
                      </button>

                      <button
                        type="button"
                        className="pools-danger-button"
                        onClick={() => handleDeletePool(pool)}
                      >
                        Delete permanently
                      </button>
                    </>
                  ) : hasHistory(pool) ? (
                    <>
                      <button
                        type="button"
                        className="pools-danger-button"
                        onClick={() => setArchived(pool, true)}
                      >
                        Archive pool
                      </button>

                      <p>
                        This pool has history, so it&apos;s archived instead
                        of deleted. You can restore it later.
                      </p>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="pools-danger-button"
                      onClick={() => handleDeletePool(pool)}
                    >
                      Delete pool
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {entryForm && selectedPool && (
        <div
          className="pools-modal-backdrop"
          onMouseDown={() => setEntryForm(null)}
        >
          <div
            className="pools-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pools-entry-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="pools-modal-heading">
              <div>
                <p>{shownPool.name}</p>

                <h2 id="pools-entry-form-title">
                  {entryForm.kind === "contribution"
                    ? entryForm.id
                      ? "Edit money in"
                      : "Add money"
                    : entryForm.id
                      ? "Edit spending"
                      : "Spend from pool"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEntryForm(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {entryForm.kind === "spending" && spendTargetPool && (
              <div className="pools-spend-available">
                <span>Available in {spendTargetPool.name}</span>
                <strong>{formatMoney(spendAvailable)}</strong>
              </div>
            )}

            <form onSubmit={handleSaveEntry} noValidate>
              <div className="pools-field-grid">
                <label className="pools-field pools-field-wide">
                  <span>
                    {entryForm.kind === "contribution"
                      ? "What happened?"
                      : "What did you buy?"}
                  </span>

                  <input
                    type="text"
                    value={entryForm.title}
                    onChange={updateEntryField("title")}
                    placeholder={
                      entryForm.kind === "contribution"
                        ? "e.g. Skipped takeout"
                        : "e.g. New headphones"
                    }
                    autoFocus={!entryForm.id}
                  />
                </label>

                <label className="pools-field">
                  <span>Amount</span>

                  <div className="pools-money-input">
                    <span>$</span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={entryForm.amount}
                      onChange={updateEntryField("amount")}
                      placeholder="0.00"
                    />
                  </div>
                </label>

                <label className="pools-field">
                  <span>Date</span>

                  <input
                    type="date"
                    value={entryForm.date}
                    onChange={updateEntryField("date")}
                  />
                </label>

                {entryForm.kind === "contribution" && (
                  <label className="pools-field">
                    <span>Type</span>

                    <select
                      value={entryForm.type}
                      onChange={updateEntryField("type")}
                    >
                      {CONTRIBUTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {entryForm.id && activePools.length > 1 && (
                  <label className="pools-field">
                    <span>Pool</span>

                    <select
                      value={entryForm.poolId}
                      onChange={updateEntryField("poolId")}
                      disabled={usedAmount > 0}
                    >
                      {pools
                        .filter(
                          (pool) =>
                            !pool.archivedAt || pool.id === shownPool.id
                        )
                        .map((pool) => (
                          <option key={pool.id} value={pool.id}>
                            {pool.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}

                <label className="pools-field pools-field-wide">
                  <span>
                    Note <small>optional</small>
                  </span>

                  <textarea
                    rows={2}
                    value={entryForm.note}
                    onChange={updateEntryField("note")}
                  />
                </label>
              </div>

              {usedAmount > 0 && (
                <p className="pools-form-hint">
                  {formatMoney(usedAmount)} of this already paid for
                  spending, so the amount can&apos;t go below that and it
                  can&apos;t move to another pool.
                </p>
              )}

              {entryForm.kind === "spending" && entryForm.id && (
                <p className="pools-form-hint">
                  Changing the amount or pool re-funds this purchase from
                  the oldest available money.
                </p>
              )}

              {entryForm.error && (
                <p className="pools-form-error" role="alert">
                  {entryForm.error}
                </p>
              )}

              <div className="pools-modal-actions">
                <button
                  type="button"
                  className="pools-secondary-button"
                  onClick={() => setEntryForm(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="pools-primary-button">
                  {entryForm.id
                    ? "Save"
                    : entryForm.kind === "contribution"
                      ? "Add to pool"
                      : "Spend from pool"}
                </button>
              </div>
            </form>

            {entryForm.id && (
              <div className="pools-danger-zone">
                {entryForm.kind === "spending" ? (
                  <button
                    type="button"
                    className="pools-danger-button"
                    onClick={handleRemoveEntry}
                  >
                    Undo spending
                  </button>
                ) : usedAmount > 0 ? (
                  <p>
                    To delete this entry, first undo the spending it paid
                    for.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="pools-danger-button"
                    onClick={handleRemoveEntry}
                  >
                    Delete entry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default Pools;
