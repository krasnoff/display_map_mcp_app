// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../assets.d.ts" />

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, type LatLngBoundsExpression, type LatLngExpression, type LatLngTuple } from "leaflet";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { DEFAULT_MAP_STYLE, MAP_STYLE_GROUPS } from "./mapStyles";
import { OsrmRoute } from "./OsrmRoute";
import type { RouteData } from "./routeData";

const defaultMarkerIcon = new Icon.Default({
  imagePath: "",
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
});

export type MapProps = {
  north: number;
  south: number;
  east: number;
  west: number;
  maptilerApiKey: string;
  position?: LatLngExpression;
  /** Driving route endpoints, each in [latitude, longitude] order. Supply both. */
  routeStart?: LatLngTuple;
  routeEnd?: LatLngTuple;
  /** Precomputed OpenRouteService route; takes precedence over route endpoints. */
  route?: RouteData;
};

function MapBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds);
  }, [bounds, map]);

  return null;
}

export function GNUIMap({ north, south, east, west, maptilerApiKey, position, routeStart, routeEnd, route }: MapProps) {
  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);
  // Leaflet coordinates are [latitude, longitude].
  const bounds = useMemo<LatLngBoundsExpression>(() => [
    [south, west], // southwest corner
    [north, east], // northeast corner
  ], [south, west, north, east]);
  const tileUrl = `https://api.maptiler.com/maps/${mapStyle}/{z}/{x}/{y}@2x.png?key=${encodeURIComponent(maptilerApiKey)}`;

  return (
    <section className="map-viewer" aria-label="Interactive map">
      <div className="map-toolbar">
        <label htmlFor="map-style">Map style</label>
        <select
          id="map-style"
          value={mapStyle}
          onChange={(event) => setMapStyle(event.target.value)}
        >
          {MAP_STYLE_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {group.label} · {style.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <MapContainer bounds={bounds} minZoom={1} style={{ height: "600px", width: "100%" }}>
        <MapBounds bounds={bounds} />
        {route ? <OsrmRoute route={route} /> :
          routeStart && routeEnd && <OsrmRoute start={routeStart} end={routeEnd} />}
        {position && <Marker position={position} icon={defaultMarkerIcon} />}
        <TileLayer
          key={mapStyle}
          url={tileUrl}
          tileSize={512}
          zoomOffset={-1}
          detectRetina={false}
          referrerPolicy="origin"
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        />
      </MapContainer>
    </section>
  );
}
