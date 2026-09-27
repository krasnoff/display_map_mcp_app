const MAPTILER_GEOCODING_URL = process.env.MAPTILER_GEOCODING_URL ??
  "https://api.maptiler.com/geocoding";
const MAPTILER_API_KEY = process.env.MAPTILER_API_KEY;

const geocodingCache = new Map<string, GeocodingResult>();

type GeocodingResult = {
  displayName: string;
  latitude: number;
  longitude: number;
  north: number;
  south: number;
  east: number;
  west: number;
};

function parseCoordinate(value: unknown, minimum: number, maximum: number) {
  const coordinate = typeof value === "number" || typeof value === "string"
    ? Number(value)
    : Number.NaN;
  return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
    ? coordinate
    : undefined;
}

export async function geocodePlace(placeName: string): Promise<GeocodingResult | undefined> {
  const cacheKey = placeName.trim().toLocaleLowerCase();
  const cachedResult = geocodingCache.get(cacheKey);
  if (cachedResult) return cachedResult;

  if (!MAPTILER_API_KEY) {
    throw new Error("MAPTILER_API_KEY is not configured.");
  }

  const baseUrl = `${MAPTILER_GEOCODING_URL.replace(/\/$/, "")}/`;
  const url = new URL(`${encodeURIComponent(placeName)}.json`, baseUrl);
  url.searchParams.set("key", MAPTILER_API_KEY);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`MapTiler returned HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("MapTiler returned an invalid response.");
  }

  const features = (payload as Record<string, unknown>).features;
  if (!Array.isArray(features)) {
    throw new Error("MapTiler returned an invalid feature collection.");
  }
  if (features.length === 0) return undefined;

  const candidate: unknown = features[0];
  if (!candidate || typeof candidate !== "object") {
    throw new Error("MapTiler returned an invalid search result.");
  }

  const result = candidate as Record<string, unknown>;
  const center = result.center;
  const boundingBox = result.bbox;

  if (!Array.isArray(center) || center.length !== 2) {
    throw new Error("MapTiler did not return a valid center.");
  }
  if (!Array.isArray(boundingBox) || boundingBox.length !== 4) {
    throw new Error("MapTiler did not return a valid bounding box.");
  }

  // MapTiler centers are [longitude, latitude] and bounding boxes are
  // [west, south, east, north].
  const longitude = parseCoordinate(center[0], -180, 180);
  const latitude = parseCoordinate(center[1], -90, 90);
  const west = parseCoordinate(boundingBox[0], -180, 180);
  const south = parseCoordinate(boundingBox[1], -90, 90);
  const east = parseCoordinate(boundingBox[2], -180, 180);
  const north = parseCoordinate(boundingBox[3], -90, 90);

  if (
    latitude === undefined || longitude === undefined || south === undefined ||
    north === undefined || west === undefined || east === undefined ||
    south > north || west > east
  ) {
    throw new Error("MapTiler returned invalid coordinates.");
  }

  const geocodedResult = {
    displayName: typeof result.place_name === "string" ? result.place_name : placeName,
    latitude,
    longitude,
    north,
    south,
    east,
    west,
  };

  geocodingCache.set(cacheKey, geocodedResult);
  return geocodedResult;
}
