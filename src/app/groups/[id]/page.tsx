"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

export default function GroupDashboardPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberMessage, setMemberMessage] = useState("");

  async function loadGroup() {
    try {
      setError("");

      const response = await fetch(`/api/groups/${groupId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load group");
      }

      setGroup(data.group);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load group"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!groupId) {
      return;
    }

    async function fetchGroup() {
      try {
        const response = await fetch(`/api/groups/${groupId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load group");
        }

        setGroup(data.group);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load group"
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchGroup();
  }, [groupId]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = memberEmail.trim();

    if (!email) {
      setMemberMessage("Please enter an email address.");
      return;
    }

    try {
      setAddingMember(true);
      setMemberMessage("");

      const response = await fetch(
        `/api/groups/${groupId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add member"
        );
      }

      setMemberEmail("");
      setMemberMessage("Member added successfully.");

      await loadGroup();
    } catch (error) {
      setMemberMessage(
        error instanceof Error
          ? error.message
          : "Failed to add member"
      );
    } finally {
      setAddingMember(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p>Loading group...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>

        <Link
          href="/groups"
          className="mt-4 inline-block text-sm font-medium underline"
        >
          Back to groups
        </Link>
      </main>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <Link
          href="/groups"
          className="text-sm text-gray-600 hover:text-black"
        >
          ← Back to groups
        </Link>

        <h1 className="mt-3 text-3xl font-bold">
          {group.name}
        </h1>

        <p className="mt-2 text-gray-600">
          Created by {group.createdBy.name}
        </p>
      </div>

      <section className="mb-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          Add Member
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Add a GroupSync user by their registered email.
        </p>

        <form
          onSubmit={addMember}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            value={memberEmail}
            onChange={(event) =>
              setMemberEmail(event.target.value)
            }
            placeholder="member@example.com"
            className="flex-1 rounded-lg border px-4 py-3"
          />

          <button
            type="submit"
            disabled={addingMember}
            className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {addingMember ? "Adding..." : "Add Member"}
          </button>
        </form>

        {memberMessage && (
          <p className="mt-3 text-sm text-gray-700">
            {memberMessage}
          </p>
        )}
      </section>

      <section className="mb-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          Members ({group.members.length})
        </h2>

        <div className="mt-4 grid gap-3">
          {group.members.map((member) => (
            <div
              key={member._id}
              className="rounded-lg border p-4"
            >
              <p className="font-medium">
                {member.name}
              </p>

              <p className="text-sm text-gray-600">
                {member.email}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Quick Actions
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href={`/groups/${group._id}/when`}
            className="rounded-xl border p-5 transition hover:shadow-md"
          >
            <h3 className="font-semibold">
              Find a Time
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Find the best common meeting slot.
            </p>
          </Link>

          <Link
            href={`/groups/${group._id}/where`}
            className="rounded-xl border p-5 transition hover:shadow-md"
          >
            <h3 className="font-semibold">
              Find a Place
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Find a fair meeting location.
            </p>
          </Link>

          <Link
            href={`/groups/${group._id}/expenses`}
            className="rounded-xl border p-5 transition hover:shadow-md"
          >
            <h3 className="font-semibold">
              Add Expense
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Add and split a shared expense.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}