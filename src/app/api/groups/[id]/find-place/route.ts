import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";

import {
  MemberLocation,
  rankCandidatePlaces,
  calculateMidpoint,
} from "@/algorithms/meetMiddle";

type LocationInput = {
  userId: string;
  name: string;
  location: string;
};

type GeoapifyGeocodeResult = {
  lat: number;
  lon: number;
  formatted?: string;
};

type GeoapifyGeocodeResponse = {
  results?: GeoapifyGeocodeResult[];
};

type GeoapifyPlaceFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    formatted?: string;
    categories?: string[];
  };
};

type GeoapifyPlacesResponse = {
  features?: GeoapifyPlaceFeature[];
};

const GEOAPIFY_API_KEY =
  process.env.GEOAPIFY_API_KEY ?? "";

if (!GEOAPIFY_API_KEY) {
  throw new Error(
    "Please define GEOAPIFY_API_KEY in .env.local"
  );
}

async function geocodeLocation(
  location: string
): Promise<{
  lat: number;
  lng: number;
  displayName: string;
} | null> {
  const url =
    "https://api.geoapify.com/v1/geocode/search?" +
    new URLSearchParams({
      text: location,
      format: "json",
      limit: "1",
      filter: "countrycode:in",
      apiKey: GEOAPIFY_API_KEY,
    }).toString();

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "Location service is temporarily unavailable"
    );
  }

  const data =
    (await response.json()) as GeoapifyGeocodeResponse;

  const result = data.results?.[0];

  if (!result) {
    return null;
  }

  return {
    lat: result.lat,
    lng: result.lon,
    displayName:
      result.formatted ?? location,
  };
}

async function findNearbyPlaces(
  lat: number,
  lng: number
) {
  const radiusMeters = 7000;

  const url =
    "https://api.geoapify.com/v2/places?" +
    new URLSearchParams({
      categories:
        "catering.restaurant,catering.cafe,education.library",
      filter: `circle:${lng},${lat},${radiusMeters}`,
      bias: `proximity:${lng},${lat}`,
      limit: "40",
      apiKey: GEOAPIFY_API_KEY,
    }).toString();

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "Nearby-place service is temporarily unavailable"
    );
  }

  const data =
    (await response.json()) as GeoapifyPlacesResponse;

  const seen = new Set<string>();

  return (data.features ?? [])
    .map((feature) => {
      const coordinates =
        feature.geometry?.coordinates;

      if (
        !coordinates ||
        coordinates.length < 2
      ) {
        return null;
      }

      const lng = coordinates[0];
      const lat = coordinates[1];

      const name =
        feature.properties?.name ??
        feature.properties?.formatted;

      if (!name) {
        return null;
      }

      const key = `${name}-${lat}-${lng}`;

      if (seen.has(key)) {
        return null;
      }

      seen.add(key);

      return {
        name,
        lat,
        lng,
        type:
          feature.properties?.categories?.[0] ??
          "place",
      };
    })
    .filter(
      (
        place
      ): place is {
        name: string;
        lat: number;
        lng: number;
        type: string;
      } => place !== null
    );
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email.toLowerCase(),
    });

    if (!currentUser) {
      return Response.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return Response.json(
        { message: "Invalid group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(id);

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (memberId: mongoose.Types.ObjectId) =>
        memberId.toString() ===
        currentUser._id.toString()
    );

    if (!isMember) {
      return Response.json(
        {
          message:
            "You are not a member of this group",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const locations: LocationInput[] =
      Array.isArray(body.locations)
        ? body.locations
        : [];

    const mode: "fair" | "efficient" =
      body.mode === "efficient"
        ? "efficient"
        : "fair";

    if (locations.length === 0) {
      return Response.json(
        {
          message:
            "Add at least one member location",
        },
        { status: 400 }
      );
    }

    const validLocations = locations.filter(
      (item) =>
        typeof item.userId === "string" &&
        typeof item.name === "string" &&
        typeof item.location === "string" &&
        item.location.trim().length > 0
    );

    if (
      validLocations.length !==
      locations.length
    ) {
      return Response.json(
        {
          message:
            "Every member must have a valid starting location",
        },
        { status: 400 }
      );
    }

    const groupMemberIds = new Set(
      group.members.map(
        (
          memberId: mongoose.Types.ObjectId
        ) => memberId.toString()
      )
    );

    const containsInvalidMember =
      validLocations.some(
        (item) =>
          !mongoose.isValidObjectId(
            item.userId
          ) ||
          !groupMemberIds.has(item.userId)
      );

    if (containsInvalidMember) {
      return Response.json(
        {
          message:
            "One or more locations belong to users outside this group",
        },
        { status: 400 }
      );
    }

    const memberLocations: MemberLocation[] =
      [];

    for (const item of validLocations) {
      const geocoded =
        await geocodeLocation(
          item.location.trim()
        );

      if (!geocoded) {
        return Response.json(
          {
            message: `Could not find location for ${item.name}: ${item.location}`,
          },
          { status: 400 }
        );
      }

      memberLocations.push({
        userId: item.userId,
        name: item.name,
        lat: geocoded.lat,
        lng: geocoded.lng,
      });
    }

    const midpoint =
      calculateMidpoint(memberLocations);

    if (!midpoint) {
      return Response.json(
        {
          message:
            "Could not calculate group midpoint",
        },
        { status: 400 }
      );
    }

    const candidates =
      await findNearbyPlaces(
        midpoint.lat,
        midpoint.lng
      );

    if (candidates.length === 0) {
      return Response.json(
        {
          message:
            "No suitable meeting places were found near the group midpoint",
        },
        { status: 404 }
      );
    }

    const rankedPlaces =
      rankCandidatePlaces(
        memberLocations,
        candidates,
        mode
      );

    return Response.json({
      success: true,
      mode,
      midpoint,
      memberLocations,
      places: rankedPlaces.slice(0, 10),
    });
  } catch (error) {
    console.error(
      "Failed to find meeting place:",
      error
    );

    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to find meeting place",
      },
      { status: 500 }
    );
  }
}