import { serve } from "@hono/node-server";
import { createHttpApp } from "./http.js";

const port = Number(process.env.PORT ?? 3001);
const app = createHttpApp();

serve({
  fetch: app.fetch,
  hostname: "127.0.0.1",
  port,
}, (info) => {
  console.log(`displaymap MCP server: http://127.0.0.1:${info.port}/mcp`);
});
