# Standalone preview instructions

These instructions supplement the repository root `AGENTS.md` for `apps/apps_sdk`.

## Scope and source

- This workspace is a standalone React/Vite preview, despite its `apps_sdk` name. It currently has no MCP or OpenAI host integration.
- `src/main.tsx` mounts `App` into `#root` under React StrictMode and imports `@workspace/ui/styles.scss`.
- `src/App.tsx` is currently a minimal viewer heading; it does not render the shared map. Do not treat this shell as an existing map regression preview.
- `vite.config.ts` configures the React plugin. The `dev` script runs Vite on port 5174.

## Implementation

- Keep standalone application layout and preview configuration here; put reusable map behavior in `packages/ui` and MCP integration in `apps/mcp_app`.
- Reuse the public `@workspace/ui` exports rather than copying the map or importing package internals.
- Keep effects safe under StrictMode and clean up subscriptions and listeners.
- Browser configuration must use an explicit Vite-compatible mechanism. This app does not inherit the MCP app's custom `MAPTILER_API_KEY` define; any key exposed to a browser is public configuration.
- Preserve the `#root` mount contract between `index.html` and `src/main.tsx`. Edit source rather than `dist/`.

## Verification

Run from the repository root:

- `pnpm --filter @workspace/apps_sdk typecheck`
- `pnpm --filter @workspace/apps_sdk build`

For visible behavior changes, run `pnpm --filter @workspace/apps_sdk dev` and check the affected view in the browser. If shared UI changes are included, follow `packages/ui/AGENTS.md` and build both consuming apps. A successful preview build does not verify MCP host rendering.
