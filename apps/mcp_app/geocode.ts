const NOMINATIM_SEARCH_URL = process.env.NOMINATIM_SEARCH_URL ??
  "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = process.env.NOMINATIM_USER_AGENT ?? "openstreetmap-mcp-app/1.0";

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

let nextNominatimRequestAt = 0;

async function waitForNominatimRateLimit() {
  const now = Date.now();
  const delay = Math.max(0, nextNominatimRequestAt - now);
  nextNominatimRequestAt = now + delay + 1_000;

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function parseCoordinate(value: unknown, minimum: number, maximum: number) {
  const coordinate = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
    ? coordinate
    : undefined;
}

export async function geocodePlace(placeName: string): Promise<GeocodingResult | undefined> {
  const cacheKey = placeName.trim().toLocaleLowerCase();
  const cachedResult = geocodingCache.get(cacheKey);
  if (cachedResult) return cachedResult;

  await waitForNominatimRateLimit();

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", placeName);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": NOMINATIM_USER_AGENT,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Nominatim returned HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) return undefined;

  const candidate: unknown = payload[0];
  if (!candidate || typeof candidate !== "object") {
    throw new Error("Nominatim returned an invalid search result.");
  }

  const result = candidate as Record<string, unknown>;
  const boundingBox = result.boundingbox;
  const latitude = parseCoordinate(result.lat, -90, 90);
  const longitude = parseCoordinate(result.lon, -180, 180);

  if (!Array.isArray(boundingBox) || boundingBox.length !== 4) {
    throw new Error("Nominatim did not return a valid bounding box.");
  }

  // Nominatim bounding boxes are ordered: south, north, west, east.
  const south = parseCoordinate(boundingBox[0], -90, 90);
  const north = parseCoordinate(boundingBox[1], -90, 90);
  const west = parseCoordinate(boundingBox[2], -180, 180);
  const east = parseCoordinate(boundingBox[3], -180, 180);

  if (
    latitude === undefined || longitude === undefined || south === undefined ||
    north === undefined || west === undefined || east === undefined ||
    south > north || west > east
  ) {
    throw new Error("Nominatim returned invalid coordinates.");
  }

  const geocodedResult = {
    displayName: typeof result.display_name === "string" ? result.display_name : placeName,
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
