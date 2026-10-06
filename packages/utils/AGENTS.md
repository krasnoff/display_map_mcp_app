# Shared utilities instructions

These instructions supplement the repository root `AGENTS.md` for `packages/utils`.

## Scope and source

- The package exports `utils.ts` directly through `@workspace/utils`; there is no compiled output or package script for build, typecheck, lint, or tests.
- `utils.ts` currently implements a Nominatim `geocodePlace` helper with an in-memory cache, request spacing, timeout, and response validation.
- This helper is separate from the active MCP geocoder in `apps/mcp_app/geocode.ts`, which uses MapTiler. Neither application currently imports `@workspace/utils`; do not assume utility changes affect MCP searches.
- Keep utilities independent of React, Leaflet, and MCP host integration. Check runtime compatibility before sharing this module with browser code: it currently reads `process.env.NOMINATIM_USER_AGENT`.

## Geocoding behavior

- Preserve the distinction between no match (`undefined`) and service or malformed-response failures (thrown errors).
- Preserve normalized cache keys, request spacing, identifying User-Agent, HTTP status handling, and bounded request time unless the task explicitly changes them.
- Validate external data before returning it. Coordinates must be finite and within latitude/longitude ranges, with ordered bounds.
- Nominatim bounding boxes use `[south, north, west, east]`; MapTiler uses a different order. Keep the returned named fields unambiguous.
- Avoid live provider calls for routine verification. Use controlled responses to check parsing, empty results, failures, caching, and request spacing when those behaviors change.

## Verification limitations

- `tsconfig.json` currently includes `src`, while the exported file is `utils.ts` at the package root. Workspace `pnpm typecheck` does not check this package, and running its current tsconfig does not verify the exported helper.
- Choose a focused verification method that actually covers the changed file and runtime. Do not claim existing workspace builds validate this unused export.
- If adding consumers or changing package configuration is part of the task, check the affected consumers and use root `pnpm typecheck` and `pnpm build` for changes spanning workspaces. Do not add tooling just for a small unrelated edit.
