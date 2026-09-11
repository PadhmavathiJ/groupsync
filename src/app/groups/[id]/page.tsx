"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
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
  createdBy: Member;
  members: Member[];
};

async function fetchGroupData(
  groupId: string
): Promise<Group> {
  const response = await fetch(
    `/api/groups/${groupId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load group"
    );
  }

  return data.group;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part[0]?.toUpperCase()
    )
    .join("");
}

export default function GroupDashboardPage() {
  const params =
    useParams<{ id: string }>();

  const groupId = params.id;

  const [group, setGroup] =
    useState<Group | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [memberEmail, setMemberEmail] =
    useState("");

  const [addingMember, setAddingMember] =
    useState(false);

  const [
    memberMessage,
    setMemberMessage,
  ] = useState("");

  const [
    memberMessageType,
    setMemberMessageType,
  ] = useState<"success" | "error" | "">(
    ""
  );

  useEffect(() => {
    if (!groupId) {
      return;
    }

    async function loadInitialGroup() {
      try {
        const result =
          await fetchGroupData(groupId);

        setGroup(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load group"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInitialGroup();
  }, [groupId]);

  async function addMember(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const email =
      memberEmail.trim();

    if (!email) {
      setMemberMessage(
        "Please enter an email address."
      );
      setMemberMessageType("error");
      return;
    }

    try {
      setAddingMember(true);
      setMemberMessage("");
      setMemberMessageType("");

      const response = await fetch(
        `/api/groups/${groupId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to add member"
        );
      }

      const refreshedGroup =
        await fetchGroupData(groupId);

      setGroup(refreshedGroup);
      setMemberEmail("");

      setMemberMessage(
        "Member added successfully."
      );
      setMemberMessageType("success");
    } catch (err) {
      setMemberMessage(
        err instanceof Error
          ? err.message
          : "Failed to add member"
      );

      setMemberMessageType("error");
    } finally {
      setAddingMember(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-36 rounded-xl bg-slate-200" />

            <div className="h-48 rounded-[2rem] bg-slate-200" />

            <div className="grid gap-5 md:grid-cols-3">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-52 rounded-[2rem] bg-slate-200"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-red-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
              Unable to open group
            </p>

            <h1 className="mt-3 text-2xl font-bold text-slate-950">
              Something went wrong.
            </h1>

            <p className="mt-2 text-slate-600">
              {error}
            </p>

            <Link
              href="/groups"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              ← Back to groups
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!group) {
    return null;
  }

  const actions = [
    {
      step: "01",
      label: "WHEN",
      title: "Find the best time",
      description:
        "Add busy hours, compare everyone's schedules, and rank the strongest meeting slots.",
      href: `/groups/${group._id}/when`,
      button: "Find a time",
      accent:
        "border-indigo-200 bg-indigo-50",
      badge:
        "bg-indigo-100 text-indigo-700",
    },
    {
      step: "02",
      label: "WHERE",
      title: "Choose a fair place",
      description:
        "Compare where everyone starts and find meeting places that are fair for the whole group.",
      href: `/groups/${group._id}/where`,
      button: "Find a place",
      accent:
        "border-violet-200 bg-violet-50",
      badge:
        "bg-violet-100 text-violet-700",
    },
    {
      step: "03",
      label: "SETTLE",
      title: "Track shared expenses",
      description:
        "Add payments, split costs, see balances, and know exactly who should pay whom.",
      href: `/groups/${group._id}/expenses`,
      button: "Manage expenses",
      accent:
        "border-emerald-200 bg-emerald-50",
      badge:
        "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* BREADCRUMB */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
        >
          <span>←</span>
          All groups
        </Link>

        {/* HERO */}
        <section className="relative mt-6 overflow-hidden rounded-[2.25rem] bg-slate-950 px-6 py-9 text-white sm:px-9 lg:px-12 lg:py-11">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-indigo-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Group workspace
              </div>

              <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                {group.name}
              </h1>

              <p className="mt-4 max-w-xl leading-7 text-slate-300">
                One shared place to coordinate
                your group&apos;s time, meeting
                location, and expenses.
              </p>

              <p className="mt-5 text-sm text-slate-400">
                Created by{" "}
                <span className="font-semibold text-white">
                  {group.createdBy.name}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
              <div className="flex -space-x-2">
                {group.members
                  .slice(0, 4)
                  .map((member) => (
                    <div
                      key={member._id}
                      title={member.name}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-indigo-500 text-xs font-bold text-white"
                    >
                      {getInitials(
                        member.name
                      ) || "M"}
                    </div>
                  ))}

                {group.members.length >
                  4 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-700 text-xs font-bold text-white">
                    +
                    {group.members.length -
                      4}
                  </div>
                )}
              </div>

              <div>
                <p className="text-lg font-bold">
                  {group.members.length}
                </p>

                <p className="text-xs text-slate-400">
                  {group.members.length ===
                  1
                    ? "member"
                    : "members"}{" "}
                  coordinating
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
              Your planning flow
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              What does your group need next?
            </h2>

            <p className="mt-2 max-w-2xl text-slate-600">
              Move through the three parts in
              order, or jump straight to the tool
              you need.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`group flex min-h-72 flex-col rounded-[2rem] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${action.accent}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black tracking-wider ${action.badge}`}
                  >
                    {action.label}
                  </span>

                  <span className="text-sm font-bold text-slate-400">
                    {action.step}
                  </span>
                </div>

                <h3 className="mt-10 text-2xl font-bold tracking-tight text-slate-950">
                  {action.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {action.description}
                </p>

                <div className="mt-auto pt-8">
                  <span className="inline-flex items-center gap-2 font-bold text-slate-950 transition group-hover:gap-3">
                    {action.button}
                    <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* MEMBERS + ADD MEMBER */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">
                  Your team
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Members
                </h2>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {group.members.length}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {group.members.map(
                (member) => {
                  const isCreator =
                    member._id ===
                    group.createdBy._id;

                  return (
                    <div
                      key={member._id}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                        {getInitials(
                          member.name
                        ) || "M"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-slate-950">
                            {member.name}
                          </p>

                          {isCreator && (
                            <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                              Creator
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600">
              +
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-950">
              Add a member
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add someone using the email they
              used to sign in to GroupSync.
            </p>

            <form
              onSubmit={addMember}
              className="mt-6 space-y-3"
            >
              <label
                htmlFor="member-email"
                className="text-sm font-semibold text-slate-700"
              >
                Member email
              </label>

              <input
                id="member-email"
                type="email"
                value={memberEmail}
                onChange={(event) =>
                  setMemberEmail(
                    event.target.value
                  )
                }
                placeholder="member@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              <button
                type="submit"
                disabled={addingMember}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingMember
                  ? "Adding member..."
                  : "Add to group"}
              </button>
            </form>

            {memberMessage && (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  memberMessageType ===
                  "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {memberMessage}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-600">
                Why can&apos;t I find someone?
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                They need to sign in to
                GroupSync once before their
                account can be added by email.
              </p>
            </div>
          </section>
        </div>

        {/* EXPLANATION */}
        <section className="mt-12 rounded-[2rem] border border-indigo-100 bg-indigo-50 px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-950">
                One group. One continuous flow.
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Coordinate availability first,
                choose a fair meeting place, then
                keep shared costs transparent.
              </p>
            </div>

            <div className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-black tracking-wide text-indigo-700 shadow-sm">
              WHEN → WHERE → SETTLE
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}