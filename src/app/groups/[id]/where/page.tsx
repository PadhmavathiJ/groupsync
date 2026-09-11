"use client";

import Link from "next/link";
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
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="mt-4 h-4 w-72 rounded bg-gray-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <Link
        href={`/groups/${groupId}`}
        className="text-sm font-medium text-gray-500 transition hover:text-black"
      >
        ← Back to group
      </Link>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            MeetMiddle
          </h1>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Smart location optimizer
          </span>
        </div>

        <p className="mt-2 max-w-2xl text-gray-600">
          Find a real meeting place that balances travel
          fairly across your whole group.
        </p>
      </div>

      {group && (
        <div className="mt-4 text-sm text-gray-500">
          Planning for{" "}
          <span className="font-medium text-gray-900">
            {group.name}
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        {/* LEFT SIDE */}

        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold">
                Where is everyone starting?
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter an area, landmark, college, station, or
                address for each group member.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {locations.map((member) => (
                <div
                  key={member.userId}
                  className="rounded-xl border bg-gray-50 p-4"
                >
                  <div className="mb-3">
                    <p className="font-medium">
                      {member.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      Starting location
                    </p>
                  </div>

                  <input
                    type="text"
                    placeholder="e.g. VIT Vellore, Katpadi Station..."
                    value={member.location}
                    onChange={(event) =>
                      updateLocation(
                        member.userId,
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:border-black"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Choose optimization style
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Decide what “best” should mean for your group.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setMode("fair");
                  setPlaces([]);
                }}
                className={`rounded-2xl border p-5 text-left transition ${
                  mode === "fair"
                    ? "border-black bg-black text-white shadow-lg"
                    : "bg-white hover:border-gray-400"
                }`}
              >
                <p className="font-semibold">
                  Fairest
                </p>

                <p
                  className={`mt-2 text-sm ${
                    mode === "fair"
                      ? "text-gray-300"
                      : "text-gray-500"
                  }`}
                >
                  Minimizes the longest distance any one
                  member has to travel.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("efficient");
                  setPlaces([]);
                }}
                className={`rounded-2xl border p-5 text-left transition ${
                  mode === "efficient"
                    ? "border-black bg-black text-white shadow-lg"
                    : "bg-white hover:border-gray-400"
                }`}
              >
                <p className="font-semibold">
                  Most Efficient
                </p>

                <p
                  className={`mt-2 text-sm ${
                    mode === "efficient"
                      ? "text-gray-300"
                      : "text-gray-500"
                  }`}
                >
                  Minimizes the total travel distance across
                  the entire group.
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={findBestPlace}
              disabled={finding || locations.length === 0}
              className="mt-6 w-full rounded-xl bg-black px-6 py-3.5 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {finding
                ? "Optimizing meeting places..."
                : "Find Best Meeting Place"}
            </button>

            {finding && (
              <p className="mt-3 text-center text-sm text-gray-500">
                Checking locations and comparing travel
                distances. This can take a few seconds.
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                {message}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT SIDE */}

        <div>
          <section className="sticky top-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Recommendations
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Ranked using your selected objective.
                </p>
              </div>

              {places.length > 0 && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                  {mode === "fair"
                    ? "Fairest"
                    : "Efficient"}
                </span>
              )}
            </div>

            {places.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                  ◎
                </div>

                <p className="mt-4 font-medium">
                  No recommendations yet
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-500">
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
                          ? "border-black"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                              {place.name}
                            </h3>

                            {index === 0 && (
                              <span className="rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white">
                                Best Match
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs capitalize text-gray-500">
                            {place.type?.replaceAll(
                              "_",
                              " "
                            ) ?? "meeting place"}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-gray-400">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Longest trip
                          </p>

                          <p className="mt-1 font-semibold">
                            {place.maxDistanceKm.toFixed(
                              1
                            )}{" "}
                            km
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Total travel
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
                          Travel by member
                        </p>

                        <div className="mt-3 space-y-2">
                          {place.distances.map(
                            (distance) => (
                              <div
                                key={distance.name}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-600">
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
                        className="mt-5 inline-flex text-sm font-medium underline underline-offset-4"
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
    </main>
  );
}