"use client";

import Link from "next/link";
import GroupSteps from "@/components/GroupSteps";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type GroupMember = {
  _id: string;
  name: string;
  email: string;
};

type Group = {
  _id: string;
  name: string;
  members: GroupMember[];
};

type LocationEntry = {
  userId: string;
  name: string;
  location: string;
};

type RankedPlace = {
  name: string;
  lat: number;
  lng: number;
  type?: string;
  distances: {
    name: string;
    distanceKm: number;
  }[];
  maxDistanceKm: number;
  totalDistanceKm: number;
};

export default function MeetMiddlePage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;

  const [group, setGroup] = useState<Group | null>(null);
  const [locations, setLocations] = useState<LocationEntry[]>([]);

  const [mode, setMode] = useState<"fair" | "efficient">("fair");

  const [places, setPlaces] = useState<RankedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!groupId) {
      return;
    }

    async function loadGroup() {
      try {
        const response = await fetch(
          `/api/groups/${groupId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load group"
          );
        }

        setGroup(data.group);

        setLocations(
          data.group.members.map(
            (member: GroupMember) => ({
              userId: member._id,
              name: member.name,
              location: "",
            })
          )
        );
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

    void loadGroup();
  }, [groupId]);

  function updateLocation(
    userId: string,
    value: string
  ) {
    setLocations((current) =>
      current.map((item) =>
        item.userId === userId
          ? {
              ...item,
              location: value,
            }
          : item
      )
    );
  }

  async function findBestPlace() {
    setError("");
    setMessage("");
    setPlaces([]);

    const missingLocation = locations.find(
      (item) => !item.location.trim()
    );

    if (missingLocation) {
      setError(
        `Enter a starting location for ${missingLocation.name}.`
      );
      return;
    }

    try {
      setFinding(true);

      const response = await fetch(
        `/api/groups/${groupId}/find-place`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locations,
            mode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to find meeting places"
        );
      }

      setPlaces(data.places ?? []);

      if (!data.places?.length) {
        setMessage(
          "No suitable meeting places were found."
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to find meeting places"
      );
    } finally {
      setFinding(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div role="status" className="motion-safe:animate-pulse">
          <span className="sr-only">Loading group locations...</span>
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-full max-w-72 rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 text-slate-950 [overflow-wrap:anywhere] sm:px-6 sm:py-12">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
      >
        ← Back to group
      </Link>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl tracking-tight">
            MeetMiddle
          </h1>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Smart location optimizer
          </span>
        </div>

        <p className="mt-2 max-w-2xl text-slate-600">
          Find a real meeting place that balances approximate distances
          across your whole group.
        </p>
      </div>

      <GroupSteps groupId={groupId} current="where" />

      {group && (
        <div className="mt-4 text-sm text-slate-500">
          Planning for{" "}
          <span className="font-medium text-slate-900">
            {group.name}
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* LEFT SIDE */}

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-xl font-semibold">
                01 / Member starting locations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter an area, landmark, college, station, or
                address for each group member.
              </p>
            </div>

            {locations.length === 0 && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No starting locations to show. Open the group to check its members.</p>}
            <div className="mt-6 space-y-4">
              {locations.map((member) => (
                <div
                  key={member.userId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3">
                    <p className="font-medium">
                      {member.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      Starting location
                    </p>
                  </div>

                  <input
                    aria-label={`Starting location for ${member.name}`}
                    type="text"
                    placeholder="e.g. VIT Vellore, Katpadi Station..."
                    value={member.location}
                    onChange={(event) =>
                      updateLocation(
                        member.userId,
                        event.target.value
                      )
                    }
                    className="min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold">
              02 / Choose what matters most
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Decide what “best” should mean for your group.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                aria-pressed={mode === "fair"}
                onClick={() => {
                  setMode("fair");
                  setPlaces([]);
                }}
                className={`rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 ${
                  mode === "fair"
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-lg"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <p className="font-semibold break-words">
                  Fairest
                </p>

                <p
                  className={`mt-2 text-sm ${
                    mode === "fair"
                      ? "text-indigo-100"
                      : "text-slate-500"
                  }`}
                >
                  Minimizes the longest straight-line distance
                  from any member to the meeting place.
                </p>
              </button>

              <button
                type="button"
                aria-pressed={mode === "efficient"}
                onClick={() => {
                  setMode("efficient");
                  setPlaces([]);
                }}
                className={`rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 ${
                  mode === "efficient"
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-lg"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <p className="font-semibold break-words">
                  Most Efficient
                </p>

                <p
                  className={`mt-2 text-sm ${
                    mode === "efficient"
                      ? "text-indigo-100"
                      : "text-slate-500"
                  }`}
                >
                  Minimizes the total straight-line distance
                  across all members, even if one person is farther away.
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={findBestPlace}
              disabled={finding || locations.length === 0}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
            >
              {finding
                ? "Optimizing meeting places..."
                : "Find Best Meeting Place"}
            </button>

            {finding && (
              <p className="mt-3 text-center text-sm text-slate-500">
                Checking locations and comparing approximate
                straight-line distances. This can take a few seconds.
              </p>
            )}

            {error && (
              <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div role="status" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {message}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT SIDE */}

        <div aria-live="polite" aria-busy={finding}>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  03 / Recommended places
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ranked using your selected objective.
                </p>
              </div>

              {places.length > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                  {mode === "fair"
                    ? "Fairest"
                    : "Efficient"}
                </span>
              )}
            </div>

            <p className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-6 text-indigo-800">Distances are approximate straight-line estimates (Haversine), not road routes or journey times. Check the map before making plans.</p>

            {places.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                  ◎
                </div>

                <p className="mt-4 font-medium">
                  {finding ? "Finding your best matches..." : "No recommendations yet"}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add everyone&apos;s starting location and
                  run the optimizer to see the best real
                  meeting places.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {places.slice(0, 5).map(
                  (place, index) => (
                    <article
                      key={`${place.name}-${place.lat}-${place.lng}`}
                      className={`rounded-2xl border p-5 ${
                        index === 0
                          ? "border-indigo-300 bg-indigo-50/60 shadow-md shadow-indigo-100/50"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 [&>div]:min-w-0">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold break-words">
                              {place.name}
                            </h3>

                            {index === 0 && (
                              <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white">
                                Best Match
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs capitalize text-slate-500">
                            {place.type?.replaceAll(
                              "_",
                              " "
                            ) ?? "meeting place"}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-slate-400">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Longest straight-line distance
                          </p>

                          <p className="mt-1 font-semibold">
                            {place.maxDistanceKm.toFixed(
                              1
                            )}{" "}
                            km
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Total straight-line distance
                          </p>

                          <p className="mt-1 font-semibold">
                            {place.totalDistanceKm.toFixed(
                              1
                            )}{" "}
                            km
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-sm font-medium">
                          Approx. distance by member
                        </p>

                        <div className="mt-3 space-y-2">
                          {place.distances.map(
                            (distance) => (
                              <div
                                key={distance.name}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm [overflow-wrap:anywhere]"
                              >
                                <span className="text-slate-600">
                                  {distance.name}
                                </span>

                                <span className="font-medium">
                                  {distance.distanceKm.toFixed(
                                    1
                                  )}{" "}
                                  km
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <a
                        href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=17/${place.lat}/${place.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                      >
                        View on map →
                      </a>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-300">Once you meet, keep shared costs clear for everyone.</p>
        <Link href={`/groups/${groupId}/expenses`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">Next: split expenses &rarr;</Link>
      </div>
    </main>
  );
}
