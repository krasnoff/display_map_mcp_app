import { createMcpHandler } from "@modelcontextprotocol/server";
import { Hono, type Handler } from "hono";
import { createServer } from "./server.js";

const PROTOCOL_VERSION_HEADER = "mcp-protocol-version";

function normalizeProtocolVersionHeader(context: Parameters<Handler>[0]) {
  const value = context.req.header(PROTOCOL_VERSION_HEADER);
  if (!value || !value.includes(",")) return;

  // Repeated HTTP headers can be collapsed to a comma-separated value by a
  // proxy. Collapse identical copies without selecting a different version.
  const versions = value
    .split(",")
    .map((version) => version.trim());
  const version = versions[0];

  if (!version || !versions.every((candidate) => candidate === version)) return;

  const headers = new Headers(context.req.raw.headers);
  headers.set(PROTOCOL_VERSION_HEADER, version);
  context.req.raw = new Request(context.req.raw, { headers });
}

export function createHttpApp(mcpPaths: string | string[] = "/mcp") {
  const app = new Hono();
  const paths = Array.isArray(mcpPaths) ? mcpPaths : [mcpPaths];
  // Serve modern per-request MCP and legacy stateless clients on the same endpoint.
  const mcpHandler = createMcpHandler(createServer, { responseMode: "json" });

  app.get("/", (context) => context.json({
    name: "displaymap-viewer",
    mcp: "/mcp",
  }));

  for (const path of paths) {
    app.use(path, async (context, next) => {
      await next();
      context.header("Access-Control-Allow-Origin", "*");
      context.header("Access-Control-Expose-Headers", "Mcp-Session-Id");
    });

    app.options(path, (context) => {
      context.header("Access-Control-Allow-Origin", "*");
      context.header("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
      context.header(
        "Access-Control-Allow-Headers",
        "content-type, accept, mcp-protocol-version, mcp-session-id, mcp-method, mcp-name, mcp-param-cursor, mcp-param-uri",
      );
      context.header("Access-Control-Expose-Headers", "Mcp-Session-Id");
      return context.body(null, 204);
    });
  }

  const handleMcpRequest: Handler = async (context) => {
    normalizeProtocolVersionHeader(context);

    try {
      return await mcpHandler.fetch(context.req.raw);
    } catch (error) {
      console.error("MCP request failed", error);
      return context.json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      }, 500);
    }
  };

  for (const path of paths) {
    app.all(path, handleMcpRequest);
  }

  return app;
}
