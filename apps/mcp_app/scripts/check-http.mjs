import assert from "node:assert/strict";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createHttpApp } from "../dist-server/http.js";

const app = createHttpApp(["/mcp", "/api/mcp"]);
const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENROUTESERVICE_API_KEY;
process.env.OPENROUTESERVICE_API_KEY = "regression-test-key";
globalThis.fetch = async () => new Response(JSON.stringify({
  routes: [{
    geometry: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
    summary: { distance: 4000, duration: 600 },
  }],
}));

try {
  for (const path of ["/mcp", "/api/mcp"]) {
    for (const modern of [true, false]) {
      const versions = [];
      const client = new Client({ name: "http-regression", version: "1.0.0" }, {
        versionNegotiation: { mode: modern ? { pin: "2026-07-28" } : "legacy" },
      });
      const transport = new StreamableHTTPClientTransport(new URL(`https://test.local${path}`), {
        fetch: (input, init) => {
          const request = new Request(input, init);
          versions.push(request.headers.get("mcp-protocol-version"));
          return app.fetch(request);
        },
      });
      try {
        await client.connect(transport);
        assert.equal(client.getProtocolEra(), modern ? "modern" : "legacy");
        const { tools } = await client.listTools();
        assert.deepEqual(tools.map((tool) => tool.name).sort(), ["geocode-place", "get-osrm-route", "open-map"]);
        const result = await client.callTool({
          name: "get-osrm-route", arguments: { coordinates: [[8, 49], [9, 50]] },
        });
        assert.ok(!result.isError);
        const route = JSON.parse(result.content[0].text);
        assert.deepEqual(route, result.structuredContent);
        assert.deepEqual(route.positions, [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
        const bounds = { north: 44, south: 38, east: -120, west: -127 };
        const opened = await client.callTool({ name: "open-map", arguments: { ...bounds, route } });
        assert.deepEqual(opened.structuredContent, { ready: true });
        assert.deepEqual((await client.callTool({ name: "open-map", arguments: bounds })).structuredContent, { ready: true });
        const invalid = await client.callTool({
          name: "open-map", arguments: { ...bounds, route: { ...route, positions: [[91, 0], [0, 0]] } },
        });
        assert.equal(invalid.isError, true);
        const resource = await client.readResource({ uri: "ui://map/app.html" });
        assert.equal(resource.contents[0].mimeType, "text/html;profile=mcp-app");
        assert.ok(resource.contents[0].text.includes("OpenRouteService"));
        if (modern) assert.ok(versions.includes("2026-07-28"));
      } finally {
        await client.close();
      }
      console.log(`${path}: ${modern ? "2026-07-28" : "legacy"} discovery, route handoff, validation and resource checks passed.`);
    }

    const preflight = await app.request(path, { method: "OPTIONS" });
    assert.equal(preflight.status, 204);
    assert.ok(preflight.headers.get("access-control-allow-headers").includes("mcp-method"));
    const requestBody = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    const headers = {
      "content-type": "application/json", accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2025-06-18, 2025-06-18",
    };
    assert.equal((await app.request(path, { method: "POST", headers, body: requestBody })).status, 200);
    headers["mcp-protocol-version"] = "2099-01-01";
    assert.equal((await app.request(path, { method: "POST", headers, body: requestBody })).status, 400);
  }
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENROUTESERVICE_API_KEY;
  else process.env.OPENROUTESERVICE_API_KEY = originalKey;
}
