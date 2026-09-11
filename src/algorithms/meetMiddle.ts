export type Coordinate = {
  lat: number;
  lng: number;
};

export type MemberLocation = {
  userId: string;
  name: string;
  lat: number;
  lng: number;
};

export type CandidatePlace = {
  name: string;
  lat: number;
  lng: number;
  type?: string;
};

export type RankedPlace = CandidatePlace & {
  distances: {
    name: string;
    distanceKm: number;
  }[];
  maxDistanceKm: number;
  totalDistanceKm: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistance(
  first: Coordinate,
  second: Coordinate
): number {
  const earthRadiusKm = 6371;

  const latDifference = toRadians(
    second.lat - first.lat
  );

  const lngDifference = toRadians(
    second.lng - first.lng
  );

  const firstLat = toRadians(first.lat);
  const secondLat = toRadians(second.lat);

  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(firstLat) *
      Math.cos(secondLat) *
      Math.sin(lngDifference / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function calculateMidpoint(
  members: MemberLocation[]
): Coordinate | null {
  if (members.length === 0) {
    return null;
  }

  const total = members.reduce(
    (sum, member) => {
      return {
        lat: sum.lat + member.lat,
        lng: sum.lng + member.lng,
      };
    },
    {
      lat: 0,
      lng: 0,
    }
  );

  return {
    lat: total.lat / members.length,
    lng: total.lng / members.length,
  };
}

export function rankCandidatePlaces(
  members: MemberLocation[],
  candidates: CandidatePlace[],
  mode: "fair" | "efficient"
): RankedPlace[] {
  if (
    members.length === 0 ||
    candidates.length === 0
  ) {
    return [];
  }

  const ranked = candidates.map((candidate) => {
    const distances = members.map((member) => ({
      name: member.name,
      distanceKm: haversineDistance(
        {
          lat: member.lat,
          lng: member.lng,
        },
        {
          lat: candidate.lat,
          lng: candidate.lng,
        }
      ),
    }));

    const distanceValues = distances.map(
      (item) => item.distanceKm
    );

    const maxDistanceKm = Math.max(
      ...distanceValues
    );

    const totalDistanceKm = distanceValues.reduce(
      (sum, distance) => sum + distance,
      0
    );

    return {
      ...candidate,
      distances,
      maxDistanceKm,
      totalDistanceKm,
    };
  });

  return ranked.sort((first, second) => {
    if (mode === "fair") {
      return (
        first.maxDistanceKm -
        second.maxDistanceKm
      );
    }

    return (
      first.totalDistanceKm -
      second.totalDistanceKm
    );
  });
}