"use client";

import {
  use,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

type Member = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
};

type Group = {
  _id: string;
  name: string;
  members: Member[];
};

type SplitUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
};

type Expense = {
  _id: string;
  description: string;
  amount: number;
  splitType: "EQUAL" | "CUSTOM";
  paidBy: SplitUser;
  participants: SplitUser[];
  splits: {
    userId: SplitUser;
    amount: number;
  }[];
  createdAt: string;
};

type Balance = {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  paid: number;
  owed: number;
  balance: number;
};

type Settlement = {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
};

type PageData = {
  group: Group;
  expenses: Expense[];
  balances: Balance[];
  settlements: Settlement[];
};

async function fetchPageData(
  id: string
): Promise<PageData> {
  const [
    groupResponse,
    expenseResponse,
    balanceResponse,
  ] = await Promise.all([
    fetch(`/api/groups/${id}`),
    fetch(`/api/groups/${id}/expenses`),
    fetch(`/api/groups/${id}/balances`),
  ]);

  const groupData = await groupResponse.json();
  const expenseData =
    await expenseResponse.json();
  const balanceData =
    await balanceResponse.json();

  if (!groupResponse.ok) {
    throw new Error(
      groupData.message ??
        "Failed to load group"
    );
  }

  if (!expenseResponse.ok) {
    throw new Error(
      expenseData.message ??
        "Failed to load expenses"
    );
  }

  if (!balanceResponse.ok) {
    throw new Error(
      balanceData.message ??
        "Failed to load balances"
    );
  }

  return {
    group: groupData.group,
    expenses: expenseData.expenses ?? [],
    balances: balanceData.balances ?? [],
    settlements:
      balanceData.settlements ?? [],
  };
}

export default function ExpensesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [group, setGroup] =
    useState<Group | null>(null);

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [balances, setBalances] =
    useState<Balance[]>([]);

  const [settlements, setSettlements] =
    useState<Settlement[]>([]);

  const [description, setDescription] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [paidBy, setPaidBy] =
    useState("");

  const [participants, setParticipants] =
    useState<string[]>([]);

  const [splitType, setSplitType] =
    useState<"EQUAL" | "CUSTOM">("EQUAL");

  const [customSplits, setCustomSplits] =
    useState<Record<string, string>>({});

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        const data =
          await fetchPageData(id);

        setGroup(data.group);
        setExpenses(data.expenses);
        setBalances(data.balances);
        setSettlements(
          data.settlements
        );

        if (
          data.group.members.length > 0
        ) {
          setPaidBy(
            data.group.members[0]._id
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, [id]);

  const selectedTotal = useMemo(() => {
    return Object.values(
      customSplits
    ).reduce(
      (sum, value) =>
        sum + (Number(value) || 0),
      0
    );
  }, [customSplits]);

  function toggleParticipant(
    userId: string
  ) {
    setParticipants((current) => {
      if (current.includes(userId)) {
        const next = current.filter(
          (participantId) =>
            participantId !== userId
        );

        setCustomSplits((previous) => {
          const copy = {
            ...previous,
          };

          delete copy[userId];

          return copy;
        });

        return next;
      }

      return [...current, userId];
    });
  }

  function selectEveryone() {
    if (!group) {
      return;
    }

    setParticipants(
      group.members.map(
        (member) => member._id
      )
    );
  }

  async function refreshData() {
    const data = await fetchPageData(id);

    setGroup(data.group);
    setExpenses(data.expenses);
    setBalances(data.balances);
    setSettlements(data.settlements);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/groups/${id}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            description,
            amount: Number(amount),
            paidBy,
            participants,
            splitType,
            customSplits:
              splitType === "CUSTOM"
                ? participants.map(
                    (userId) => ({
                      userId,
                      amount: Number(
                        customSplits[
                          userId
                        ] ?? 0
                      ),
                    })
                  )
                : undefined,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Failed to add expense"
        );
      }

      setDescription("");
      setAmount("");
      setParticipants([]);
      setCustomSplits({});
      setSplitType("EQUAL");

      await refreshData();

      setSuccess(
        "Expense added successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add expense"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse rounded-3xl bg-white p-8 shadow-sm">
            Loading expenses...
          </div>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
          Group not found.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Group expenses
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Split costs without the confusion.
              </h1>

              <p className="mt-2 text-slate-600">
                {group.name} · add expenses,
                track balances, and see who
                should pay whom.
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              {group.members.length} members
            </div>
          </div>
        </section>

        {(error || success) && (
          <section
            className={`rounded-2xl border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || success}
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Add an expense
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose who paid and who
                participated.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Description
                  </span>

                  <input
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Dinner, cab, tickets..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Amount
                  </span>

                  <input
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value
                      )
                    }
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1200"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Paid by
                </span>

                <select
                  value={paidBy}
                  onChange={(event) =>
                    setPaidBy(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  {group.members.map(
                    (member) => (
                      <option
                        key={member._id}
                        value={member._id}
                      >
                        {member.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Participants
                  </span>

                  <button
                    type="button"
                    onClick={selectEveryone}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Select everyone
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {group.members.map(
                    (member) => {
                      const selected =
                        participants.includes(
                          member._id
                        );

                      return (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() =>
                            toggleParticipant(
                              member._id
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">
                            {member.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {member.email}
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setSplitType("EQUAL")
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    splitType === "EQUAL"
                      ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200"
                  }`}
                >
                  <p className="font-semibold text-slate-900">
                    Equal split
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Divide the total evenly.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSplitType("CUSTOM")
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    splitType === "CUSTOM"
                      ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200"
                  }`}
                >
                  <p className="font-semibold text-slate-900">
                    Custom split
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Set exact amounts manually.
                  </p>
                </button>
              </div>

              {splitType === "CUSTOM" &&
                participants.length > 0 && (
                  <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                    {participants.map(
                      (userId) => {
                        const member =
                          group.members.find(
                            (item) =>
                              item._id ===
                              userId
                          );

                        if (!member) {
                          return null;
                        }

                        return (
                          <label
                            key={userId}
                            className="flex items-center justify-between gap-4"
                          >
                            <span className="text-sm font-medium text-slate-700">
                              {member.name}
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                customSplits[
                                  userId
                                ] ?? ""
                              }
                              onChange={(
                                event
                              ) =>
                                setCustomSplits(
                                  (
                                    current
                                  ) => ({
                                    ...current,
                                    [userId]:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right outline-none focus:border-indigo-400"
                            />
                          </label>
                        );
                      }
                    )}

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                      <span className="font-medium text-slate-600">
                        Custom total
                      </span>

                      <span className="font-bold text-slate-900">
                        ₹
                        {selectedTotal.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Adding expense..."
                  : "Add Expense"}
              </button>
            </form>
          </section>

          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Group balances
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Positive means receive.
                  Negative means owe.
                </p>
              </div>

              <div className="space-y-3">
                {balances.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {member.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Paid ₹
                        {member.paid.toFixed(
                          2
                        )}{" "}
                        · Share ₹
                        {member.owed.toFixed(
                          2
                        )}
                      </p>
                    </div>

                    <span
                      className={`text-lg font-bold ${
                        member.balance > 0
                          ? "text-emerald-600"
                          : member.balance <
                              0
                            ? "text-red-600"
                            : "text-slate-500"
                      }`}
                    >
                      {member.balance > 0
                        ? "+"
                        : ""}
                      ₹
                      {member.balance.toFixed(
                        2
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Settle up
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Suggested payments to
                  clear the group.
                </p>
              </div>

              {settlements.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
                  Everyone is settled up.
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map(
                    (
                      settlement,
                      index
                    ) => (
                      <div
                        key={`${settlement.fromUserId}-${settlement.toUserId}-${index}`}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <p className="text-sm text-slate-500">
                          Payment suggestion
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {
                            settlement.fromName
                          }{" "}
                          →{" "}
                          {
                            settlement.toName
                          }
                        </p>

                        <p className="mt-2 text-xl font-bold text-indigo-600">
                          ₹
                          {settlement.amount.toFixed(
                            2
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Recent expenses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Every expense saved for this
              group.
            </p>
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No expenses yet. Add the
              first one above.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {expenses.map(
                (expense) => (
                  <article
                    key={expense._id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {
                            expense.description
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Paid by{" "}
                          {
                            expense.paidBy
                              .name
                          }
                        </p>
                      </div>

                      <span className="text-lg font-bold text-slate-900">
                        ₹
                        {expense.amount.toFixed(
                          2
                        )}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {
                          expense
                            .participants
                            .length
                        }{" "}
                        participants
                      </span>

                      <span>
                        {expense.splitType ===
                        "EQUAL"
                          ? "Equal split"
                          : "Custom split"}
                      </span>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}