# architect-sdk

Public npm monorepo (npm workspaces):
- `packages/sdk` — **`@architectcms/sdk`**: `ArchitectDelivery`, `ArchitectPreview`, `ArchitectManagement` clients + `generateTypes`. Zero runtime deps.
- `packages/cli` — **`@architectcms/cli`** (bin `architect`): a thin wrapper around the SDK. It does **no direct HTTP** — every API call goes through `@architectcms/sdk`, and it authenticates with a management API key just like the SDK.

## Repository hygiene — READ FIRST

**This repository is PUBLIC.** Its entire git history is visible to anyone. Do not commit:

- **Secrets of any kind** — API keys, tokens, passwords, `.env` files, `*.pem`/`*.key`, `~/.architect/credentials.json`. In tests/examples use obvious placeholders only (e.g. `arch_mgmt_test`, `arch_delivery_test`), never a real key.
- **Internal planning or design docs** — implementation plans, specs, roadmaps, architecture write-ups, anything describing private backend internals. These belong in a private location, **not** here. `docs/plans/` and `docs/specs/` are gitignored on purpose.
- **Local/agent artifacts** — `.playwright-mcp/`, scratch files, editor junk.

If you ever need a plan/spec to do work here, keep it outside the repo (a private dir or a separate private repo). When in doubt, don't commit it.

## Conventions

- **Conventional Commits** for messages (`feat(scope): …`, `fix: …`, `chore: …`; `!`/`BREAKING CHANGE:` for majors).
- **Add a Changeset for every user-facing change**: `npx changeset` → pick the package(s) and bump (`patch`/`minor`/`major`) and write a one-line summary. Releases are driven by Changesets via `.github/workflows/release.yml`; do not hand-edit versions.
- Keep the CLI a pure SDK wrapper — if the CLI needs a new API call, add it to the SDK first.

## Commands

```bash
npm install            # install workspaces
npm run build          # build both packages (tsup)
npm test               # run all tests (vitest)
npm run lint           # typecheck both packages
```
