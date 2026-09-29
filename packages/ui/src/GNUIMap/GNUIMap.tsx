import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
// The stylesheet is loaded by the bundler; TypeScript does not have declarations for CSS files.
// @ts-ignore
import "leaflet/dist/leaflet.css";
import { LatLngBoundsExpression } from "leaflet";
import { DEFAULT_MAP_STYLE, MAP_STYLE_GROUPS } from "./mapStyles";

type MapProps = {
  north: number;
  south: number;
  east: number;
  west: number;
  maptilerApiKey: string;
};

function MapBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds);
  }, [bounds, map]);

  return null;
}

export function GNUIMap({ north, south, east, west, maptilerApiKey }: MapProps) {
  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);
  // Leaflet coordinates are [latitude, longitude].
  const bounds: LatLngBoundsExpression = [
    [south, west], // southwest corner
    [north, east], // northeast corner
  ];
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
