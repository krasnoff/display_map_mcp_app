import { StreamableHTTPTransport } from "@hono/mcp";
import { SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/sdk/types.js";
import { Hono, type Handler } from "hono";
import { HTTPException } from "hono/http-exception";
import { createServer } from "./server.js";

const PROTOCOL_VERSION_HEADER = "mcp-protocol-version";

function normalizeProtocolVersionHeader(context: Parameters<Handler>[0]) {
  const value = context.req.header(PROTOCOL_VERSION_HEADER);
  if (!value || SUPPORTED_PROTOCOL_VERSIONS.includes(value)) return;

  // Repeated HTTP headers can be collapsed to a comma-separated value by a
  // proxy. @hono/mcp expects one version and otherwise rejects the request.
  const supportedValue = value
    .split(",")
    .map((version) => version.trim())
    .find((version) => SUPPORTED_PROTOCOL_VERSIONS.includes(version));

  if (!supportedValue) return;

  const headers = new Headers(context.req.raw.headers);
  headers.set(PROTOCOL_VERSION_HEADER, supportedValue);
  context.req.raw = new Request(context.req.raw, { headers });
}

export function createHttpApp(mcpPaths: string | string[] = "/mcp") {
  const app = new Hono();
  const paths = Array.isArray(mcpPaths) ? mcpPaths : [mcpPaths];

  app.get("/", (context) => context.json({
    name: "openstreetmap-viewer",
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
        "content-type, accept, mcp-protocol-version, mcp-session-id",
      );
      context.header("Access-Control-Expose-Headers", "Mcp-Session-Id");
      return context.body(null, 204);
    });
  }

  const handleMcpRequest: Handler = async (context) => {
    normalizeProtocolVersionHeader(context);

    const server = createServer();
    const transport = new StreamableHTTPTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    try {
      await server.connect(transport);
      const response = await transport.handleRequest(context);

      return response ?? context.json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "The MCP transport returned no response." },
        id: null,
      }, 500);
    } catch (error) {
      console.error("MCP request failed", error);

      if (error instanceof HTTPException) {
        const protocolVersion = context.req.header(PROTOCOL_VERSION_HEADER);

        if (error.status !== 404 || !protocolVersion) {
          const response = error.getResponse();
          return new Response(response.body, {
            status: error.status,
            headers: response.headers,
          });
        }

        return context.json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: protocolVersion
              ? "Bad Request: Unsupported protocol version"
              : "Bad MCP request",
            data: protocolVersion
              ? { receivedVersion: protocolVersion, supportedVersions: SUPPORTED_PROTOCOL_VERSIONS }
              : undefined,
          },
          id: null,
        }, 400);
      }
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
