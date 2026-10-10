import type { LatLngTuple } from "leaflet";

export type RouteData = {
  positions: LatLngTuple[];
  distance: number;
  duration: number;
};

export function isRouteData(value: unknown): value is RouteData {
  if (!value || typeof value !== "object") return false;
  const route = value as Record<string, unknown>;
  return Array.isArray(route.positions) && route.positions.length >= 2 &&
    route.positions.every((position: unknown) => Array.isArray(position) && position.length === 2 &&
      typeof position[0] === "number" && Number.isFinite(position[0]) && Math.abs(position[0]) <= 90 &&
      typeof position[1] === "number" && Number.isFinite(position[1]) && Math.abs(position[1]) <= 180) &&
    typeof route.distance === "number" && Number.isFinite(route.distance) && route.distance >= 0 &&
    typeof route.duration === "number" && Number.isFinite(route.duration) && route.duration >= 0;
}
