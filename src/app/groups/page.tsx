"use client";

import Link from "next/link";
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
  members: Member[];
};

async function fetchGroupsData(): Promise<Group[]> {
  const response = await fetch("/api/groups");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load groups"
    );
  }

  return data.groups ?? [];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function GroupsPage() {
  const [groups, setGroups] =
    useState<Group[]>([]);

  const [name, setName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadInitialGroups() {
      try {
        const result =
          await fetchGroupsData();

        setGroups(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load groups"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInitialGroups();
  }, []);

  async function createGroup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(
        "Please enter a name for your group."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch(
        "/api/groups",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create group"
        );
      }

      setName("");

      const refreshedGroups =
        await fetchGroupsData();

      setGroups(refreshedGroups);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create group"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* PAGE INTRO */}
        <section className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Your shared planning spaces
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Your groups,
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                all in sync.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Create a group for your project
              team, club, trip, study circle, or
              friends — then coordinate time,
              place, and expenses together.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-slate-950">
                WHEN
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Find a time
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-slate-950">
                WHERE
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Meet fairly
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-slate-950">
                SETTLE
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Split costs
              </p>
            </div>
          </div>
        </section>

        {/* CREATE GROUP */}
        <section
  id="create-group"
  className="mt-12 scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-100"
>
          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            <div className="bg-slate-950 p-7 text-white sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-bold shadow-lg shadow-indigo-950/30">
                +
              </div>

              <h2 className="mt-7 text-2xl font-bold tracking-tight">
                Start something together.
              </h2>

              <p className="mt-3 max-w-md leading-7 text-slate-300">
                Your group becomes one shared
                workspace for planning meetings
                and keeping expenses clear.
              </p>

              <div className="mt-8 space-y-3 text-sm text-slate-300">
                <p>✓ Add your members</p>
                <p>✓ Compare schedules</p>
                <p>✓ Find fair meeting places</p>
                <p>✓ Track shared expenses</p>
              </div>
            </div>

            <div className="p-7 sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
                Create new group
              </p>

              <h3 className="mt-2 text-2xl font-bold text-slate-950">
                What should we call your group?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use something everyone will
                instantly recognize.
              </p>

              <form
                onSubmit={createGroup}
                className="mt-7"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. DBMS Project Team"
                    maxLength={80}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />

                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating
                      ? "Creating..."
                      : "Create Group →"}
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* EXISTING GROUPS */}
        <section className="mt-14">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
                Your spaces
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Pick up where you left off.
              </h2>
            </div>

            {!loading && (
              <p className="text-sm text-slate-500">
                {groups.length}{" "}
                {groups.length === 1
                  ? "group"
                  : "groups"}
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                ✦
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950">
                No groups yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first group above.
                Once it exists, you can add
                members and start coordinating.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {groups.map((group) => (
                <Link
                  key={group._id}
                  href={`/groups/${group._id}`}
                  className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40"
                >
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-indigo-50 opacity-70 transition group-hover:bg-indigo-100" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                        {getInitials(
                          group.name
                        ) || "G"}
                      </div>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {group.members.length}{" "}
                        {group.members.length ===
                        1
                          ? "member"
                          : "members"}
                      </span>
                    </div>

                    <h3 className="mt-8 text-2xl font-bold tracking-tight text-slate-950">
                      {group.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Plan your next meeting and
                      keep everyone coordinated.
                    </p>

                    <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
                      <div className="flex -space-x-2">
                        {group.members
                          .slice(0, 4)
                          .map((member) => (
                            <div
                              key={member._id}
                              title={
                                member.name
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[10px] font-bold text-indigo-700"
                            >
                              {getInitials(
                                member.name
                              ) || "M"}
                            </div>
                          ))}

                        {group.members.length >
                          4 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600">
                            +
                            {group.members
                              .length - 4}
                          </div>
                        )}
                      </div>

                      <span className="text-sm font-bold text-indigo-600 transition group-hover:translate-x-1">
                        Open group →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* SMALL HELP SECTION */}
        <section className="mt-16 rounded-[2rem] bg-indigo-50 px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-950">
                New to GroupSync?
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Create a group → add members →
                find a time → find a place →
                settle expenses.
              </p>
            </div>

            <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
              WHEN → WHERE → SETTLE
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}