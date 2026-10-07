import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App as McpApp } from "@modelcontextprotocol/ext-apps";
import "./style.scss";
import { GNUIMap } from "@workspace/ui";

type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
  position?: [number, number];
};

const DEFAULT_BOUNDS: MapBounds = {
  north: 51.52,
  south: 51.5,
  east: -0.11,
  west: -0.15,
};

function isMapBounds(value: unknown): value is MapBounds {
  if (!value || typeof value !== "object") return false;

  const bounds = value as Record<string, unknown>;
  const position = bounds.position;
  const validPosition = position === undefined || (
    Array.isArray(position) && position.length === 2 &&
    typeof position[0] === "number" && Number.isFinite(position[0]) &&
    position[0] >= -90 && position[0] <= 90 &&
    typeof position[1] === "number" && Number.isFinite(position[1]) &&
    position[1] >= -180 && position[1] <= 180
  );
  return validPosition && ["north", "south", "east", "west"].every(
    (key) => typeof bounds[key] === "number" && Number.isFinite(bounds[key]),
  );
}

function MapApp() {
  const [bounds, setBounds] = useState<MapBounds>(DEFAULT_BOUNDS);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const app = new McpApp({ name: "displaymap viewer", version: "1.0.0" });

    app.ontoolinput = (input) => {
      if (isMapBounds(input.arguments)) {
        setBounds(input.arguments);
        setStatus("");
      } else {
        setStatus("The map bounds or marker position supplied by the host are invalid.");
      }
    };

    app.onhostcontextchanged = (context) => {
      document.documentElement.dataset.theme = context.theme ?? "light";
    };
    app.onteardown = async () => ({});
    app.connect().catch((error: unknown) => {
      console.error(error);
      setStatus("Running in standalone preview mode.");
    });

  }, []);

  return (
    <main className="page-shell">
      {status && <p className="status" role="status">{status}</p>}
      <GNUIMap
        {...bounds}
        maptilerApiKey={import.meta.env.MAPTILER_API_KEY}
        position={bounds.position ?? [(bounds.north + bounds.south) / 2, (bounds.east + bounds.west) / 2]}
      />
    </main>
  );
}

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Missing #app root element");
createRoot(root).render(<MapApp />);
