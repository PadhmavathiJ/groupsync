"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import GroupSteps from "@/components/GroupSteps";
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
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 text-slate-950 [overflow-wrap:anywhere] sm:px-6 sm:py-12">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
      >
        ← Back to group
      </Link>

      <div className="mt-4">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          MeetWhen
        </h1>

        <p className="mt-2 text-slate-600">
          Add busy times and let GroupSync rank the
          best meeting times for your group.
        </p>
      </div>

      <GroupSteps groupId={groupId} current="when" />

      {/* ADD BUSY TIME */}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold">
          01 / Add busy time
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Tell GroupSync when you are unavailable.
        </p>

        <form
          onSubmit={saveBusySlot}
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label htmlFor="when-field-1" className="mb-2 block text-sm font-medium">
              Day
            </label>

            <select id="when-field-1"
              value={day}
              onChange={(event) => {
                setDay(event.target.value);
                setMeetingSlots([]);
                setFindTimeMessage("");
              }}
              className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
            <label htmlFor="when-field-2" className="mb-2 block text-sm font-medium">
              Busy from
            </label>

            <input id="when-field-2"
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
              className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="when-field-3" className="mb-2 block text-sm font-medium">
              Busy until
            </label>

            <input id="when-field-3"
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
              className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving || loading}
              className="w-full rounded-xl bg-indigo-600 p-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
            >
              {saving
                ? "Saving..."
                : "Add Busy Time"}
            </button>
          </div>
        </form>

        {message && (
          <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      {/* GROUP SCHEDULES */}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold">
          02 / Group schedules
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Busy times entered by group members.
        </p>

        {loading ? (
          <p role="status" className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500 motion-safe:animate-pulse">Loading your group schedules...</p>
        ) : schedules.length === 0 ? (
          <p className="mt-4 text-slate-600">
            {error ? "Schedules are unavailable. Check the message above and refresh to try again." : "No busy times yet. Add your first busy time above, then ask your group to add theirs."}
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {schedules.map((schedule) => (
              <div
                key={schedule._id}
                className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="font-semibold break-words">
                      {schedule.userId.name}
                    </p>

                    <p className="text-sm text-slate-600">
                      {schedule.dayOfWeek}
                    </p>
                  </div>

                  <span className="text-sm text-slate-500">
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
                        className="rounded-lg bg-slate-100 px-3 py-2 text-sm"
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

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div>
          <h2 className="text-xl font-semibold">
            03 / Find the best meeting time
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            GroupSync compares everyone&apos;s busy
            schedules and ranks the best available
            meeting slots.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="when-field-4" className="mb-2 block text-sm font-medium">
              Day
            </label>

            <select id="when-field-4"
              value={day}
              onChange={(event) => {
                setDay(event.target.value);
                setMeetingSlots([]);
                setFindTimeMessage("");
              }}
              className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
            <label htmlFor="when-field-5" className="mb-2 block text-sm font-medium">
              Search from
            </label>

            <input id="when-field-5"
              type="time"
              value={searchStart}
              onChange={(event) =>
                setSearchStart(event.target.value)
              }
              className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="when-field-6" className="mb-2 block text-sm font-medium">
              Search until
            </label>

            <input id="when-field-6"
              type="time"
              value={searchEnd}
              onChange={(event) =>
                setSearchEnd(event.target.value)
              }
              className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="when-field-7" className="mb-2 block text-sm font-medium">
              Duration
            </label>

            <select id="when-field-7"
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(
                  Number(event.target.value)
                )
              }
              className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-950 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
          className="mt-5 w-full rounded-xl transition hover:bg-indigo-700 sm:w-auto bg-indigo-600 px-6 py-3 font-medium text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          {findingTime
            ? "Finding..."
            : "Find Best Time"}
        </button>

        {findTimeMessage && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {findTimeMessage}
          </p>
        )}

      </section>

      <section aria-label="Ranked meeting times" aria-live="polite" aria-busy={findingTime} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {meetingSlots.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <h2 className="text-xl font-bold">04 / Ranked recommendations</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{findingTime ? "Comparing schedules to find your best matches..." : findTimeMessage ? "Try another day, a wider search window, or a shorter duration." : "Choose a day and search window above, then select Find Best Time. Your top matches will appear here."}</p>
          </div>
        )}
        {meetingSlots.length > 0 && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                04 / Ranked recommendations
              </h2>

              <span className="text-sm text-slate-500">
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
                      className={`min-w-0 rounded-2xl border p-5 sm:p-6 ${index === 0 ? "border-indigo-300 bg-indigo-50/60 shadow-md shadow-indigo-100/50" : "border-slate-200 bg-white"}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-lg font-semibold">
                              {slot.startTime} –{" "}
                              {slot.endTime}
                            </p>

                            {index === 0 && (
                              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                                Best Match
                              </span>
                            )}

                            {everyoneAvailable && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                Everyone Free
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-slate-600">
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

                          <p className="text-xs text-slate-500">
                            of members available
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-slate-600">{slot.availableMembers.length} of {slot.availableMembers.length + slot.unavailableMembers.length} members can attend this time.</p>

                      {slot.availableMembers.length >
                        0 && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                          <p className="text-sm font-semibold">
                            Available
                          </p>

                          <p className="mt-1 text-sm break-words">
                            {slot.availableMembers.join(
                              ", "
                            )}
                          </p>
                        </div>
                      )}

                      {slot.unavailableMembers.length >
                        0 && (
                        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
                          <p className="text-sm font-semibold">
                            Unavailable
                          </p>

                          <p className="mt-1 text-sm break-words">
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
      <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-300">Found a time that works? Choose where to meet next.</p>
        <Link href={`/groups/${groupId}/where`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">Next: choose a place &rarr;</Link>
      </div>
    </main>
  );
}
