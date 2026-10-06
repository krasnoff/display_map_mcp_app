# Repository instructions

## Work efficiently

- Implement the requested task through verification; keep changes focused and preserve unrelated user edits.
- Check `git status --short` and inspect relevant source and package scripts before editing.
- Use `rg` and targeted file reads. Exclude dependencies and generated output from broad searches.
- Batch independent reads and searches. Start with the affected workspace; expand investigation only when evidence requires it.
- Resolve routine, reversible choices using existing patterns. Ask when missing information materially changes the intended behavior or scope.
- Use a short plan for multi-step work; skip planning ceremony for straightforward edits.
- Avoid unrelated refactors, dependency upgrades, formatting sweeps, and speculative abstractions.

## Project map

This is a pnpm/Turborepo TypeScript monorepo using React, Leaflet, Vite, Hono, and the MCP SDK.

| Area | Responsibility |
| --- | --- |
| `apps/mcp_app/server.ts` | MCP tools (`geocode-place`, `open-map`) and embedded UI resource |
| `apps/mcp_app/geocode.ts` | MapTiler place searches |
| `apps/mcp_app/http.ts` | Streamable HTTP transport |
| `apps/mcp_app/mcp.ts`, `apps/mcp_app/api/mcp.ts` | Local and Vercel server entry points |
| `apps/mcp_app/src/` | React MCP App UI and host integration |
| `apps/apps_sdk/` | Standalone Vite preview application |
| `packages/ui/` | Shared React/Leaflet map component and styles |
| `packages/utils/` | Shared utilities |

Read `README.md` for setup and connection instructions rather than duplicating them here.

## Commands and verification

Run commands from the repository root. Use pnpm (pinned in `package.json`); preserve `pnpm-lock.yaml` and workspace dependencies.

| Purpose | Command |
| --- | --- |
| Install when needed | `pnpm install --frozen-lockfile` |
| Check MCP server types | `pnpm --filter @workspace/mcp_app typecheck` |
| Check shared UI types | `pnpm --filter @workspace/ui typecheck` |
| Check preview types | `pnpm --filter @workspace/apps_sdk typecheck` |
| Build MCP UI and server | `pnpm --filter @workspace/mcp_app build` |
| Build standalone preview | `pnpm --filter @workspace/apps_sdk build` |
| Check all workspace types | `pnpm typecheck` |
| Build all workspaces | `pnpm build` |

- Run checks appropriate to the changed behavior. Use workspace-wide checks for changes spanning workspaces or build configuration.
- MCP `typecheck` checks server code only. For MCP UI changes, also run `pnpm --filter @workspace/mcp_app exec tsc --noEmit -p tsconfig.json` and the MCP build.
- For shared UI changes, check UI types and build both consuming applications.
- No lint or test scripts are currently configured. Do not invent commands or add tooling solely to validate a small change.
- For behavior changes, use a focused regression test when practical or a reproducible manual check. MCP host rendering requires a compatible client; a build alone does not verify it.
- Documentation-only changes need a diff and accuracy check, not application builds.
- After successful relevant checks, stop repeating them unless code changes or new evidence warrants it. Report failures and checks that could not run accurately.

## Build constraints

- The MCP build runs `build:ui` → `generate:html` → `build:server`. The generated module is imported by the server and must exist before server compilation.
- Edit source, not `apps/mcp_app/generated/app-html.ts`, `dist/`, or `dist-server/`. Regenerate embedded HTML through the build scripts.
- During MCP development, run `build:ui` and `generate:html` before `dev`, and rerun both after UI changes; server watch mode does not rebuild the embedded UI.
- Keep the MCP UI bundled as a single HTML resource. Preserve `ui://map/app.html` and tool contracts unless the task requires changing them.

## Implementation conventions

- Follow nearby TypeScript, React, and SCSS conventions. Prefer clear domain types and inferred types; validate untrusted data rather than hiding errors with `any` or assertions.
- Use functional components and hooks. Keep derived values out of state, check effect dependencies, and clean up listeners and subscriptions.
- Keep reusable map behavior in `packages/ui`; keep host integration in the application.
- Validate tool inputs, host messages, and external responses at their boundaries. Handle HTTP failures, invalid data, and asynchronous errors explicitly.
- Keep MCP schemas, descriptions, structured results, and UI expectations consistent. Preserve latitude/longitude semantics and visible map attribution.
- Server-side ESM imports use `.js` extensions even when their source files are TypeScript.
- Reuse existing packages before adding dependencies. Update documentation when contracts, setup, configuration, or user-facing behavior changes.

## Credentials and completion

- Never print or commit credentials or secret-bearing `.env` files. `MAPTILER_API_KEY` is used for server geocoding and browser tiles; browser map keys must be treated as public and restricted appropriately, not described as server-only secrets.
- Review the final diff for unintended changes and generated artifacts.
- Finish with a concise account of what changed, what was verified, and any remaining limitation. Claim a check passed only if it actually ran successfully.
