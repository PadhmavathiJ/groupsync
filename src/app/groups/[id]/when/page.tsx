"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type BusySlot = {
  startTime: string;
  endTime: string;
};

type SavedSchedule = {
  _id: string;
  dayOfWeek: string;
  busySlots: BusySlot[];
  userId: {
    _id: string;
    name: string;
    email: string;
  };
};

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function MeetWhenPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;

  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");

  const [schedules, setSchedules] = useState<SavedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSchedules() {
    try {
      const response = await fetch(
        `/api/groups/${groupId}/schedules`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load schedules"
        );
      }

      setSchedules(data.schedules);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load schedules"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!groupId) {
      return;
    }

    async function fetchSchedules() {
      try {
        const response = await fetch(
          `/api/groups/${groupId}/schedules`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load schedules"
          );
        }

        setSchedules(data.schedules);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load schedules"
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchSchedules();
  }, [groupId]);

  async function saveBusySlot(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setSaving(true);

      const existingSchedule = schedules.find(
        (schedule) => schedule.dayOfWeek === day
      );

      const existingSlots =
        existingSchedule?.busySlots ?? [];

      const response = await fetch(
        `/api/groups/${groupId}/schedules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dayOfWeek: day,
            busySlots: [
              ...existingSlots,
              {
                startTime,
                endTime,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save busy time"
        );
      }

      setMessage("Busy time saved.");
      await loadSchedules();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save busy time"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link
        href={`/groups/${groupId}`}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back to group
      </Link>

      <div className="mt-4">
        <h1 className="text-3xl font-bold">
          MeetWhen
        </h1>

        <p className="mt-2 text-gray-600">
          Add your busy times so GroupSync can find
          when everyone is free.
        </p>
      </div>

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          Add Busy Time
        </h2>

        <form
          onSubmit={saveBusySlot}
          className="mt-5 grid gap-4 md:grid-cols-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Day
            </label>

            <select
              value={day}
              onChange={(event) =>
                setDay(event.target.value)
              }
              className="w-full rounded-lg border p-3"
            >
              {days.map((currentDay) => (
                <option
                  key={currentDay}
                  value={currentDay}
                >
                  {currentDay}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Busy from
            </label>

            <input
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Busy until
            </label>

            <input
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-black p-3 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Busy Time"}
            </button>
          </div>
        </form>

        {message && (
          <p className="mt-4 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          Group Schedules
        </h2>

        {loading ? (
          <p className="mt-4">Loading schedules...</p>
        ) : schedules.length === 0 ? (
          <p className="mt-4 text-gray-600">
            No busy times have been added yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {schedules.map((schedule) => (
              <div
                key={schedule._id}
                className="rounded-lg border p-4"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {schedule.userId.name}
                    </p>

                    <p className="text-sm text-gray-600">
                      {schedule.dayOfWeek}
                    </p>
                  </div>

                  <span className="text-sm text-gray-500">
                    {schedule.busySlots.length} busy{" "}
                    {schedule.busySlots.length === 1
                      ? "slot"
                      : "slots"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {schedule.busySlots.map(
                    (slot, index) => (
                      <span
                        key={`${slot.startTime}-${slot.endTime}-${index}`}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm"
                      >
                        {slot.startTime} – {slot.endTime}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}