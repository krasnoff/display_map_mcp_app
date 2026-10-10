import { useEffect, useState } from "react";
import { Polyline, Popup, useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { RouteData } from "./routeData";

type OsrmRouteProps = {
  start: LatLngTuple;
  end: LatLngTuple;
};

type Route = RouteData;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCoordinate(value: unknown): value is LatLngTuple {
  return Array.isArray(value) && value.length === 2 &&
    typeof value[0] === "number" && Number.isFinite(value[0]) && Math.abs(value[0]) <= 90 &&
    typeof value[1] === "number" && Number.isFinite(value[1]) && Math.abs(value[1]) <= 180;
}

function parseRoute(data: unknown): Route {
  if (!isRecord(data)) throw new Error("Invalid routing response");
  if (data.code !== "Ok" || !Array.isArray(data.routes) || !data.routes.length) {
    throw new Error(typeof data.message === "string" ? data.message : "No route found");
  }

  const result: unknown = data.routes[0];
  if (!isRecord(result) || !isRecord(result.geometry) || result.geometry.type !== "LineString" ||
    !Array.isArray(result.geometry.coordinates) || result.geometry.coordinates.length < 2 ||
    typeof result.distance !== "number" || !Number.isFinite(result.distance) || result.distance < 0 ||
    typeof result.duration !== "number" || !Number.isFinite(result.duration) || result.duration < 0) {
    throw new Error("Invalid routing response");
  }

  const positions = result.geometry.coordinates.map((coordinate: unknown): LatLngTuple => {
    if (!Array.isArray(coordinate) || coordinate.length !== 2) {
      throw new Error("Invalid route coordinates");
    }
    // OSRM GeoJSON uses [longitude, latitude]; Leaflet uses [latitude, longitude].
    const position: unknown = [coordinate[1], coordinate[0]];
    if (!isCoordinate(position)) throw new Error("Invalid route coordinates");
    return position;
  });
  return { positions, distance: result.distance, duration: result.duration };
}

export function OsrmRoute(props: OsrmRouteProps | { route: RouteData }) {
  return "route" in props
    ? <RoutePolyline route={props.route} provider="openrouteservice" />
    : <FetchedOsrmRoute {...props} />;
}

function FetchedOsrmRoute({ start, end }: OsrmRouteProps) {
  const map = useMap();
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState("");
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  useEffect(() => {
    const controller = new AbortController();
    setRoute(null);
    setError("");

    if (!isCoordinate([startLat, startLng]) || !isCoordinate([endLat, endLng])) {
      setError("Route endpoints must be valid [latitude, longitude] coordinates");
      return () => controller.abort();
    }

    async function loadRoute() {
      try {
        const coordinates = `${startLng},${startLat};${endLng},${endLat}`;
        const response = await fetch(
          `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Routing request failed: ${response.status}`);
        const data: unknown = await response.json();
        const nextRoute = parseRoute(data);
        if (controller.signal.aborted) return;
        setRoute(nextRoute);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load route");
      }
    }

    const timer = window.setTimeout(loadRoute, 1000);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [map, startLat, startLng, endLat, endLng]);

  if (error) {
    // A standalone popup needs a valid location even when an endpoint is invalid.
    const errorPosition: LatLngTuple = [startLat, startLng];
    return <Popup position={isCoordinate(errorPosition) ? errorPosition : map.getCenter()}>{error}</Popup>;
  }
  if (!route) return null;

  return <RoutePolyline route={route} provider="fossgis" />;
}

function RoutePolyline({ route, provider }: { route: RouteData; provider: "openrouteservice" | "fossgis" }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(route.positions, { padding: [30, 30] });
  }, [map, route.positions]);

  return (
    <Polyline
      positions={route.positions}
      pathOptions={{ color: "#2563eb", weight: 5 }}
      attribution={provider === "openrouteservice"
        ? 'Routing: <a href="https://openrouteservice.org/">OpenRouteService</a> / ' +
          '<a href="https://heigit.org/">HeiGIT</a>, © OpenStreetMap contributors'
        : 'Routing: <a href="https://project-osrm.org/">OSRM</a> / ' +
        '<a href="https://www.fossgis.de/">FOSSGIS</a>, © OpenStreetMap contributors · ' +
        '<a href="https://www.openstreetmap.org/fixthemap">Fix the map</a>'}
    >
      <Popup>
        Distance: {(route.distance / 1000).toFixed(1)} km
        <br />
        Estimated time: {Math.round(route.duration / 60)} minutes
      </Popup>
    </Polyline>
  );
}
