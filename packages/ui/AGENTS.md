# Shared UI instructions

These instructions supplement the repository root `AGENTS.md` for `packages/ui`.

## Scope and source

- This package exports TypeScript source directly; consuming Vite applications bundle it. `build` and `typecheck` both run `tsc --noEmit`.
- `src/index.ts` is the public component entry point. `src/styles.scss` is exported separately as `@workspace/ui/styles.scss`.
- `src/GNUIMap/GNUIMap.tsx` owns reusable Leaflet rendering, bounds updates, and map style selection. `src/GNUIMap/mapStyles.ts` owns the style catalog and default.
- Keep MCP host messages, connection lifecycle, and environment loading in the consuming app. Pass browser configuration through component props.

## Map behavior

- Preserve the `north`, `south`, `east`, `west`, and `maptilerApiKey` prop contract unless the task requires changing consumers too.
- Leaflet coordinates use `[latitude, longitude]`; bounds use southwest `[south, west]` and northeast `[north, east]`. Keep updates working after initial mount through `useMap` and effects.
- Preserve visible MapTiler/OpenStreetMap attribution and accessible toolbar labels and keyboard controls.
- Keep tile URL construction, tile size, zoom offset, and retina behavior consistent. Check provider support before adding or changing style IDs.
- The browser tile key is public configuration. Do not hardcode credentials or move server geocoding into this component.
- Inspect consuming app styles before changing layout: map toolbar and container styling currently also lives in `apps/mcp_app/src/style.scss`. Changes to shared global styles can affect the standalone preview.

## Verification

Run from the repository root:

- `pnpm --filter @workspace/ui typecheck`
- `pnpm --filter @workspace/apps_sdk build`
- `pnpm --filter @workspace/mcp_app build`

The MCP build requires `MAPTILER_API_KEY`. For map behavior changes, manually check initial bounds, changed bounds, style selection, sizing, and attribution in a view that actually renders `GNUIMap`; the preview shell does not currently render it. Report host or browser checks that could not run.
