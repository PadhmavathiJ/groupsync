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

type MeetingSlot = {
  startTime: string;
  endTime: string;
  availableMembers: string[];
  unavailableMembers: string[];
  attendancePercentage: number;
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

  // Busy-time form
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");

  // Find-time form
  const [searchStart, setSearchStart] = useState("09:00");
  const [searchEnd, setSearchEnd] = useState("18:00");
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Data
  const [schedules, setSchedules] = useState<SavedSchedule[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [meetingSlots, setMeetingSlots] = useState<MeetingSlot[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [findingTime, setFindingTime] = useState(false);

  // Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [findTimeMessage, setFindTimeMessage] = useState("");

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

      setSchedules(data.schedules ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load schedules"
      );
    }
  }

  useEffect(() => {
    if (!groupId) {
      return;
    }

    async function loadPageData() {
      try {
        const [scheduleResponse, userResponse] =
          await Promise.all([
            fetch(`/api/groups/${groupId}/schedules`),
            fetch("/api/users/me"),
          ]);

        const scheduleData = await scheduleResponse.json();
        const userData = await userResponse.json();

        if (!scheduleResponse.ok) {
          throw new Error(
            scheduleData.message ||
              "Failed to load schedules"
          );
        }

        if (!userResponse.ok) {
          throw new Error(
            userData.message ||
              "Failed to load current user"
          );
        }

        setSchedules(scheduleData.schedules ?? []);

        if (userData.user?._id) {
          setCurrentUserId(userData.user._id);
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load MeetWhen"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPageData();
  }, [groupId]);

  async function saveBusySlot(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!currentUserId) {
      setError("Could not identify the logged-in user.");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setSaving(true);

      const existingSchedule = schedules.find(
        (schedule) =>
          schedule.dayOfWeek === day &&
          schedule.userId._id === currentUserId
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

  async function handleFindTime() {
    setFindTimeMessage("");
    setMeetingSlots([]);

    if (searchEnd <= searchStart) {
      setFindTimeMessage(
        "Search end time must be after start time."
      );
      return;
    }

    try {
      setFindingTime(true);

      const response = await fetch(
        `/api/groups/${groupId}/find-time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dayOfWeek: day,
            searchStart,
            searchEnd,
            durationMinutes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to find meeting times"
        );
      }

      const results: MeetingSlot[] = Array.isArray(
        data.results
      )
        ? data.results
        : [];

      setMeetingSlots(results);

      if (results.length === 0) {
        setFindTimeMessage(
          "No suitable meeting times were found."
        );
      }
    } catch (error) {
      setFindTimeMessage(
        error instanceof Error
          ? error.message
          : "Failed to find meeting times"
      );
    } finally {
      setFindingTime(false);
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
          Add busy times and let GroupSync rank the
          best meeting times for your group.
        </p>
      </div>

      {/* ADD BUSY TIME */}

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          Add Busy Time
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Tell GroupSync when you are unavailable.
        </p>

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
              onChange={(event) => {
                setDay(event.target.value);
                setMeetingSlots([]);
                setFindTimeMessage("");
              }}
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
              disabled={saving || loading}
              className="w-full rounded-lg bg-black p-3 text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Add Busy Time"}
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

      {/* GROUP SCHEDULES */}

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          Group Schedules
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Busy times entered by group members.
        </p>

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
                        {slot.startTime} –{" "}
                        {slot.endTime}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FIND BEST MEETING TIME */}

      <section className="mt-8 rounded-xl border p-6">
        <div>
          <h2 className="text-xl font-semibold">
            Find Best Meeting Time
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            GroupSync compares everyone&apos;s busy
            schedules and ranks the best available
            meeting slots.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Day
            </label>

            <select
              value={day}
              onChange={(event) => {
                setDay(event.target.value);
                setMeetingSlots([]);
                setFindTimeMessage("");
              }}
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
              Search from
            </label>

            <input
              type="time"
              value={searchStart}
              onChange={(event) =>
                setSearchStart(event.target.value)
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Search until
            </label>

            <input
              type="time"
              value={searchEnd}
              onChange={(event) =>
                setSearchEnd(event.target.value)
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Duration
            </label>

            <select
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(
                  Number(event.target.value)
                )
              }
              className="w-full rounded-lg border p-3"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFindTime}
          disabled={findingTime}
          className="mt-5 rounded-lg bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
        >
          {findingTime
            ? "Finding..."
            : "Find Best Time"}
        </button>

        {findTimeMessage && (
          <p className="mt-4 text-sm text-red-700">
            {findTimeMessage}
          </p>
        )}

        {meetingSlots.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Recommended Times
              </h3>

              <span className="text-sm text-gray-500">
                Ranked by attendance
              </span>
            </div>

            <div className="mt-4 grid gap-4">
              {meetingSlots
                .slice(0, 5)
                .map((slot, index) => {
                  const everyoneAvailable =
                    slot.attendancePercentage === 100;

                  return (
                    <div
                      key={`${slot.startTime}-${slot.endTime}`}
                      className="rounded-xl border p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-semibold">
                              {slot.startTime} –{" "}
                              {slot.endTime}
                            </p>

                            {index === 0 && (
                              <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                                Best Match
                              </span>
                            )}

                            {everyoneAvailable && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                Everyone Free
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-gray-600">
                            {
                              slot.availableMembers
                                .length
                            }{" "}
                            member
                            {slot.availableMembers
                              .length === 1
                              ? ""
                              : "s"}{" "}
                            available
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {Math.round(
                              slot.attendancePercentage
                            )}
                            %
                          </p>

                          <p className="text-xs text-gray-500">
                            attendance
                          </p>
                        </div>
                      </div>

                      {slot.availableMembers.length >
                        0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">
                            Available
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {slot.availableMembers.join(
                              ", "
                            )}
                          </p>
                        </div>
                      )}

                      {slot.unavailableMembers.length >
                        0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium">
                            Unavailable
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {slot.unavailableMembers.join(
                              ", "
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}