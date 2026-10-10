const DIRECTIONS_URL = "https://api.heigit.org/openrouteservice/v2/directions/driving-car";

/** API waypoints use [longitude, latitude], unlike Leaflet positions. */
export type RouteCoordinate = [longitude: number, latitude: number];

/** Matches the route state rendered by OsrmRoute.tsx. Distance is metres; duration is seconds. */
export type RouteResult = {
  positions: [latitude: number, longitude: number][];
  distance: number;
  duration: number;
};

type RouteOptions = {
  apiKey?: string;
  signal?: AbortSignal;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCoordinate(value: unknown): value is RouteCoordinate {
  return Array.isArray(value) && value.length === 2 &&
    typeof value[0] === "number" && Number.isFinite(value[0]) && Math.abs(value[0]) <= 180 &&
    typeof value[1] === "number" && Number.isFinite(value[1]) && Math.abs(value[1]) <= 90;
}

// The JSON directions endpoint uses Google's encoded polyline format, precision 5.
function decodeGeometry(geometry: string): RouteResult["positions"] {
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const positions: RouteResult["positions"] = [];

  function readDelta(): number {
    let value = 0;
    let shift = 0;
    while (index < geometry.length && shift <= 25) {
      const byte = geometry.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) throw new Error("Invalid route geometry.");
      value += (byte & 31) * 2 ** shift;
      if (byte < 32) return value % 2 === 1 ? -(value + 1) / 2 : value / 2;
      shift += 5;
    }
    throw new Error("Invalid route geometry.");
  }

  while (index < geometry.length) {
    latitude += readDelta();
    longitude += readDelta();
    const lat = latitude / 100_000;
    const lng = longitude / 100_000;
    if (!isCoordinate([lng, lat])) throw new Error("Invalid route coordinates.");
    positions.push([lat, lng]);
  }
  if (positions.length < 2) throw new Error("Route geometry must contain at least two positions.");
  return positions;
}

function parseRoute(payload: unknown): RouteResult {
  if (!isRecord(payload) || !Array.isArray(payload.routes)) {
    throw new Error("OpenRouteService returned an invalid response.");
  }
  if (payload.routes.length === 0) throw new Error("No route found.");

  const route: unknown = payload.routes[0];
  if (!isRecord(route) || typeof route.geometry !== "string" || !isRecord(route.summary)) {
    throw new Error("OpenRouteService returned an invalid route.");
  }
  const { distance, duration } = route.summary;
  if (typeof distance !== "number" || !Number.isFinite(distance) || distance < 0 ||
    typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
    throw new Error("OpenRouteService returned an invalid route summary.");
  }
  return { positions: decodeGeometry(route.geometry), distance, duration };
}

/** Fetch a driving route through two or more API waypoints, returning Leaflet positions. */
export async function fetchRoute(
  coordinates: readonly RouteCoordinate[],
  options: RouteOptions = {},
): Promise<RouteResult> {
  if (!Array.isArray(coordinates) || coordinates.length < 2 || !coordinates.every(isCoordinate)) {
    throw new Error("Provide at least two valid [longitude, latitude] coordinates.");
  }
  const apiKey = (options.apiKey ?? process.env.OPENROUTESERVICE_API_KEY)?.trim();
  if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not configured.");

  const timeout = AbortSignal.timeout(10_000);
  const response = await fetch(DIRECTIONS_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: apiKey,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ coordinates }),
    signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
  });
  if (!response.ok) throw new Error(`OpenRouteService returned HTTP ${response.status}.`);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("OpenRouteService returned invalid JSON.");
    throw error;
  }
  return parseRoute(payload);
}
