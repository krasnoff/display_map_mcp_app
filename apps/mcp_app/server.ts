import { McpServer } from "@modelcontextprotocol/server";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { geocodePlace } from "./geocode.js";
import { fetchRoute } from "./osrm-provider.js";
import appHtml from "./generated/app-html.js";

const RESOURCE_URI = "ui://map/app.html";
const routeSchema = z.object({
  positions: z.array(z.tuple([
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
  ])).min(2).describe("Route geometry in Leaflet [latitude, longitude] order"),
  distance: z.number().nonnegative().describe("Total route distance in metres"),
  duration: z.number().nonnegative().describe("Estimated travel time in seconds"),
});

export function registerServer(server: McpServer) {
  server.registerTool("geocode-place", {
    title: "Find place coordinates",
    description: "Convert a place name into coordinates and geographic bounds. Pass north, south, east, and west from the result to open-map, and use [latitude, longitude] as its position.",
    inputSchema: {
      placeName: z.string().trim().min(1).max(300).describe("Place to find, for example: Paris, France"),
    },
    outputSchema: {
      displayName: z.string(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      north: z.number().min(-90).max(90),
      south: z.number().min(-90).max(90),
      east: z.number().min(-180).max(180),
      west: z.number().min(-180).max(180),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
    },
  }, async ({ placeName }) => {
    try {
      const result = await geocodePlace(placeName);
      if (!result) {
        return {
          content: [{ type: "text", text: `No place was found for “${placeName}”.` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: `Found ${result.displayName}. Use north ${result.north}, south ${result.south}, east ${result.east}, west ${result.west}, and position [${result.latitude}, ${result.longitude}] with open-map.`,
        }],
        structuredContent: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown geocoding error.";
      return {
        content: [{ type: "text", text: `Could not geocode “${placeName}”: ${message}` }],
        isError: true,
      };
    }
  });

  server.registerTool("get-osrm-route", {
    title: "Get driving route",
    description: "Fetch a driving route from OpenRouteService through two or more [longitude, latitude] waypoints. Returns the complete route object in structuredContent and as JSON text: positions, distance, and duration. Pass this entire object as the route argument to open-map without omitting or changing positions. Returned positions use [latitude, longitude].",
    inputSchema: {
      coordinates: z.array(z.tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90),
      ])).min(2).describe("Ordered waypoints as [longitude, latitude], including start and end"),
    },
    outputSchema: routeSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async ({ coordinates }, extra) => {
    try {
      const route = await fetchRoute(coordinates, { signal: extra.mcpReq.signal });
      return {
        // Include identical JSON for clients that only expose text content to the model.
        content: [{ type: "text", text: JSON.stringify(route) }],
        structuredContent: route,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown routing error.";
      return { content: [{ type: "text", text: `Could not fetch driving route: ${message}` }], isError: true };
    }
  });

  registerAppTool(server, "open-map", {
    title: "Open map",
    description: "Display an interactive displaymap map for the supplied geographic bounds, with a marker at position or the bounds' center when omitted. Supply route from get-osrm-route to draw the route and fit the map to it.",
    inputSchema: {
      north: z.number().min(-90).max(90).describe("Northern latitude of the map bounds"),
      south: z.number().min(-90).max(90).describe("Southern latitude of the map bounds"),
      east: z.number().min(-180).max(180).describe("Eastern longitude of the map bounds"),
      west: z.number().min(-180).max(180).describe("Western longitude of the map bounds"),
      position: z.tuple([
        z.number().min(-90).max(90),
        z.number().min(-180).max(180),
      ]).optional().describe("Marker position as [latitude, longitude]; defaults to the bounds' center"),
      route: routeSchema.optional().describe("Complete structured result from get-osrm-route"),
    },
    outputSchema: { ready: z.boolean() },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async ({ north, south, east, west, position, route }) => {
    const [latitude, longitude] = position ?? [(north + south) / 2, (east + west) / 2];
    return {
      content: [{
        type: "text",
        text: `Interactive map opened for bounds north ${north}, south ${south}, east ${east}, west ${west}, with a marker at [${latitude}, ${longitude}].${route ? ` Driving route: ${(route.distance / 1000).toFixed(1)} km, approximately ${Math.round(route.duration / 60)} minutes.` : ""}`,
      }],
      structuredContent: { ready: true },
    };
  });

  registerAppResource(server, "displaymap map", RESOURCE_URI, {
    description: "Interactive displaymap map",
  }, async () => ({
    contents: [{
      uri: RESOURCE_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: appHtml, //await readFile(APP_HTML_PATH, "utf8"),
      _meta: {
        ui: {
          // this line is for debugging with mcp inspector only, but it is not needed for the app to work
          // domain: "displaymap-viewer",
          csp: {
            connectDomains: ["https://routing.openstreetmap.de"],
            resourceDomains: ["https://api.maptiler.com"],
          },
        },
      },
    }],
  }));

  return server;
}

export function createServer() {
  return registerServer(
    new McpServer({ name: "displaymap-viewer", version: "1.0.0" }),
  );
}
