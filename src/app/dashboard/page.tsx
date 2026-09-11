"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Group = { _id: string; name: string; members: { _id: string }[] };

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadGroups() {
      try {
        const response = await fetch("/api/groups");
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load your groups.");
        if (active) setGroups(data.groups ?? []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load your groups.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadGroups();
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 text-slate-950 sm:px-6 lg:px-8 lg:py-16">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Your dashboard</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Welcome to your next plan.</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">One place to pick up with your groups. Find a time, choose a place, and keep shared costs clear.</p>
        </div>
        <Link href="/groups#create-group" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700">Create a group &rarr;</Link>
      </section>

      <section aria-label="How GroupSync works" className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["01", "WHEN", "Find your overlap", "Add busy times and compare ranked meeting slots."],
          ["02", "WHERE", "Meet in the middle", "Compare places by approximate straight-line distance."],
          ["03", "SETTLE", "Keep costs clear", "Record shared expenses and see who owes whom."],
        ].map(([number, label, title, description]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-indigo-600">{number} / {label}</p>
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </section>

      <section className="mt-12" aria-busy={loading}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Your groups {!loading && !error && <span className="ml-2 rounded-full bg-indigo-100 px-3 py-1 text-lg text-indigo-700">{groups.length}</span>}</h2>
          <Link href="/groups" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 hover:underline">View all groups &rarr;</Link>
        </div>
        {loading ? (
          <div role="status" className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 motion-safe:animate-pulse">Loading your groups...</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <p className="mt-2 text-sm">Refresh to try again, or return to your groups.</p>
            <Link href="/groups" className="mt-3 inline-flex min-h-11 items-center font-semibold underline">Go to groups</Link>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="text-xl font-bold">Your first plan starts here.</h3>
            <p className="mt-2 text-slate-600">Create a group, add your members, and start with WHEN.</p>
            <Link href="/groups#create-group" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700">Create your first group</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link key={group._id} href={`/groups/${group._id}`} className="group min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-indigo-600">
                <p className="text-xs font-semibold text-slate-500">{group.members.length} {group.members.length === 1 ? "member" : "members"}</p>
                <h3 className="mt-3 text-xl font-bold break-words">{group.name}</h3>
                <p className="mt-6 border-t border-slate-100 pt-4 text-sm font-bold text-indigo-600">Open group &rarr;</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
