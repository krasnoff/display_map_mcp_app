# DisplayMap MCP App Server

An [MCP App](https://modelcontextprotocol.io/) server that lets compatible AI clients find places and display interactive maps using DisplayMap.

The server exposes two MCP tools:

- `geocode-place` converts a place name into coordinates and map bounds.
- `open-map` displays an interactive DisplayMap map for supplied bounds.

The map interface is a React application packaged as a single HTML MCP resource. The MCP server uses Streamable HTTP and runs on Hono with the Model Context Protocol TypeScript SDK.

## Hosted MCP endpoint

The public server is available at:

```text
https://display-map-mcp-apps-sdk.vercel.app/mcp
```

[Connect to the hosted DisplayMap MCP server](https://display-map-mcp-apps-sdk.vercel.app/mcp)

The URL is an MCP endpoint, not a conventional web page. Open it through an MCP-compatible client rather than expecting a browser interface.

## Requirements

- Node.js 20 or newer
- [pnpm](https://pnpm.io/) 10 or newer
- An MCP client that supports Streamable HTTP
- An MCP Apps-compatible host to render the interactive map UI

## Install

Clone the repository and install its workspace dependencies:

```bash
git clone <repository-url>
cd open_street_map_mcp_app
pnpm install
```

## Build

Build every application and shared package in the monorepo:

```bash
pnpm build
```

To build only the MCP application:

```bash
pnpm --filter @workspace/mcp_app build
```

The MCP build performs three steps:

1. Vite compiles the React map UI into a single HTML file.
2. The generated HTML is embedded in a TypeScript module for the MCP resource.
3. TypeScript compiles the server into `apps/mcp_app/dist-server`.

## Run locally

Set your MapTiler API key in `apps/mcp_app/.env`:

```text
MAPTILER_API_KEY=your_maptiler_api_key
```

The key is used by both the `geocode-place` tool and the MapTiler tile layer.

Build and start the compiled MCP server:

```bash
pnpm --filter @workspace/mcp_app build
pnpm --filter @workspace/mcp_app serve
```

The local MCP endpoint is:

```text
http://127.0.0.1:3001/mcp
```

To use a different port:

```bash
PORT=4000 pnpm --filter @workspace/mcp_app serve
```

The endpoint will then be `http://127.0.0.1:4000/mcp`.

### Development mode

Prepare the embedded UI and run the TypeScript server in watch mode:

```bash
pnpm --filter @workspace/mcp_app build:ui
pnpm --filter @workspace/mcp_app generate:html
pnpm --filter @workspace/mcp_app dev
```

Server-side TypeScript changes restart the development server automatically. After changing the React UI, rerun `build:ui` and `generate:html` so the server embeds the latest UI.

To run all workspace development tasks, including the separate Vite preview application, use:

```bash
pnpm dev
```

## Type-check

Check the complete workspace:

```bash
pnpm typecheck
```

Or check only the MCP server:

```bash
pnpm --filter @workspace/mcp_app typecheck
```

## Lint

Run ESLint across the workspace from the repository root:

```bash
pnpm lint
```

The root `eslint.config.js` checks JavaScript, TypeScript, and React Hooks,
with browser and Node.js globals scoped to the relevant source files. Generated
HTML modules, build output, and dependencies are excluded. Unused variables and
Hook dependency issues are reported as warnings. Linting is separate from the
TypeScript checks above.

## Connect from ChatGPT

ChatGPT can connect to the hosted server as a remote MCP connection. The server does not require authentication.

### Enable developer mode

1. Open [ChatGPT](https://chatgpt.com/) and sign in.
2. Open **Settings**, then select **Security and login**.
3. Turn on **Developer mode**.

Developer mode availability can depend on your account and workspace policy.

### Add the MCP server

1. Go to [ChatGPT Plugins](https://chatgpt.com/plugins).
2. Select the **+** button.
3. Enter `Display Map` as the name and a short description such as `Find places and display interactive maps`.
4. Under **Connection**, enter the remote MCP server URL:

   ```text
   https://display-map-mcp-apps-sdk.vercel.app/mcp
   ```

5. Create the connection and review the discovered tools.

Start a new conversation, add **Display Map** from the tools menu, and ask:

```text
Find Paris, France and open an interactive map of it.
```

ChatGPT should call `geocode-place`, pass the returned bounds to `open-map`, and display the interactive map. See OpenAI's [official connection and testing guide](https://developers.openai.com/plugins/deploy/connect-chatgpt) for current details.

> ChatGPT must be able to reach the MCP server over HTTPS. Use the hosted endpoint above rather than `localhost`.

## Connect from Claude.ai

Claude.ai can connect to the hosted server as a custom remote MCP connector. The server does not require authentication.

### Individual Free, Pro, or Max plans

1. Open [Claude.ai](https://claude.ai/new) and sign in.
2. Navigate to **Customize**, then **Connectors**.
3. Select **+**, then **Add custom connector**.
4. Enter `Display Map` as the connector name.
5. Enter the remote MCP server URL:

   ```text
   https://display-map-mcp-apps-sdk.vercel.app/mcp
   ```

6. Leave the OAuth fields in **Advanced settings** empty and select **Add**.

Free accounts can currently configure one custom connector. Availability and limits may change; see [Anthropic's custom connector documentation](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

### Team or Enterprise plans

An Owner or Primary Owner must first add the connector for the organization:

1. Navigate to **Organization settings**, then **Connectors**.
2. Select **Add**.
3. Hover over **Custom** and select **Web**.
4. Enter the hosted MCP URL shown above and finish adding the connector.

Organization members can then navigate to **Customize**, then **Connectors**, find the DisplayMap connector, and select **Connect**.

### Enable and use the connector

Connectors are enabled separately for each conversation:

1. Start a new conversation in Claude.ai.
2. Select the **+** button in the lower-left corner of the chat.
3. Open **Connectors** and enable **DisplayMap**.
4. Ask Claude:

   ```text
   Find Paris, France and open an interactive map of it.
   ```

Claude should call `geocode-place`, pass the returned bounds to `open-map`, and display the interactive map.

> Claude.ai connects from Anthropic's cloud infrastructure. It cannot connect to `localhost` or another MCP server that is accessible only from your computer; use the public HTTPS endpoint above.

## Project structure

```text
apps/
  mcp_app/       MCP server, embedded React map UI, and Vercel function
  apps_sdk/      Standalone Vite preview application
packages/
  ui/            Shared React/Leaflet map component
  utils/         Shared utilities
```

Important MCP application files:

- `apps/mcp_app/server.ts` registers the MCP tools and interactive UI resource.
- `apps/mcp_app/http.ts` configures the Hono Streamable HTTP endpoint.
- `apps/mcp_app/mcp.ts` starts the local Node.js server.
- `apps/mcp_app/api/mcp.ts` provides the Vercel Function entry point.
- `apps/mcp_app/src/main.tsx` initializes the embedded MCP App UI.
- `packages/ui/src/GNUIMap/GNUIMap.tsx` renders the Leaflet/DisplayMap map.

## Map services

Map tiles and place searches use MapTiler and require `MAPTILER_API_KEY`. Map data attribution remains visible in the map. Deployments should comply with the applicable MapTiler and DisplayMap usage policies.

## License

MIT
