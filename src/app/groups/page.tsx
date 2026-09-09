"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

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

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadGroups() {
    try {
      setError("");

      const response = await fetch("/api/groups");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load groups");
      }

      setGroups(data.groups);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load groups"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  async function fetchGroups() {
    try {
      setError("");

      const response = await fetch("/api/groups");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load groups");
      }

      setGroups(data.groups);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load groups"
      );
    } finally {
      setLoading(false);
    }
  }

  void fetchGroups();
}, []);

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Please enter a group name");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create group");
      }

      setName("");
      await loadGroups();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create group"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Groups</h1>
        <p className="mt-2 text-gray-600">
          Create a group and start planning together.
        </p>
      </div>

      <form onSubmit={createGroup} className="mb-8 flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter group name"
          className="flex-1 rounded-lg border px-4 py-3"
        />

        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Group"}
        </button>
      </form>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading groups...</p>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <h2 className="text-xl font-semibold">No groups yet</h2>
          <p className="mt-2 text-gray-600">
            Create your first group above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Link
              key={group._id}
              href={`/groups/${group._id}`}
              className="rounded-xl border p-5 transition hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">
                {group.name}
              </h2>

              <p className="mt-1 text-gray-600">
                {group.members.length}{" "}
                {group.members.length === 1 ? "member" : "members"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}