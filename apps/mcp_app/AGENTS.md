# MCP application instructions

These instructions supplement the repository root `AGENTS.md` for `apps/mcp_app`. Use the root `README.md` for current setup; the local README still contains template examples that do not match the active tools and scripts.

## Source boundaries

- `server.ts` registers `geocode-place`, `open-map`, and the single HTML resource `ui://map/app.html`. Keep schemas, descriptions, structured results, and UI expectations aligned.
- `geocode.ts` is the active MapTiler geocoder. It does not use the Nominatim helper in `packages/utils`.
- `http.ts` owns the shared stateless Hono Streamable HTTP layer, protocol-header handling, CORS, and transport errors. Preserve fresh server/transport creation per HTTP request unless session behavior is explicitly being changed.
- `mcp.ts` starts the local HTTP server on loopback; `api/mcp.ts` adapts the same app for Vercel routes `/mcp` and `/api/mcp`. The current local entry point does not implement stdio switching.
- `src/main.tsx` owns React rendering and MCP App host integration. `src/style.scss` owns application styling; reusable map behavior belongs in `packages/ui`.

## Contracts and boundaries

- `geocode-place` accepts a place name and returns a display name, center coordinates, and named bounds. `open-map` accepts bounds and returns `{ ready: true }`; the UI receives map bounds through tool input arguments.
- Validate tool inputs, host arguments, and provider responses at their boundaries. Preserve finite coordinate ranges and bounds ordering when changing validation.
- MapTiler centers are `[longitude, latitude]` and bounding boxes are `[west, south, east, north]`; convert correctly to named bounds and Leaflet coordinates.
- Preserve explicit no-result and asynchronous failure handling. Avoid logging keys or full credential-bearing request URLs.
- Register host callbacks before connecting. Clean up connections and subscriptions when changing lifecycle behavior, and preserve host theme handling and useful standalone connection-failure status.
- Keep resource CSP domains aligned with actual browser requests. Preserve visible map attribution and the single HTML resource contract.
- Server-side ESM relative imports use `.js` extensions; browser source follows the existing Vite conventions.

## Build and configuration

- Build order is `build:ui` → `generate:html` → `build:server`. `scripts/generate-html.ts` embeds `dist/index.html` into `generated/app-html.ts`, which `server.ts` imports.
- Edit source, never generated HTML modules, `dist/`, or `dist-server/` by hand.
- Before server watch development, run `pnpm --filter @workspace/mcp_app build:ui` and `pnpm --filter @workspace/mcp_app generate:html` from the root. Repeat both after UI edits; `dev` watches the server only.
- The UI build requires `MAPTILER_API_KEY` and explicitly embeds it through `vite.config.ts`; geocoding also reads it on the server. Treat browser keys as public and restrict them appropriately. Do not expose other environment variables through build defines.

## Verification

Run from the repository root:

- Server changes: `pnpm --filter @workspace/mcp_app typecheck`.
- UI changes: `pnpm --filter @workspace/mcp_app exec tsc --noEmit -p tsconfig.json` and `pnpm --filter @workspace/mcp_app build`.
- Build, resource generation, or deployment configuration changes: run the full MCP build. Server checks need the generated module to exist; prepare it through the build scripts if missing.

For behavior changes, check the affected tool or HTTP path with a reproducible request. UI host behavior needs a compatible MCP Apps client: check tool input updates, invalid input status, theme changes, and map rendering as relevant. Builds alone do not verify host integration or deployed routes. Report missing credentials or unavailable clients accurately.
