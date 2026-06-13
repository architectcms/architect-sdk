# Architect SDK & CLI

The official TypeScript SDK and command-line tool for [Architect CMS](https://www.architectcms.com) — an AI-native platform to model, manage, and deliver any kind of content as one connected, context-aware graph.

This is a public npm monorepo (npm workspaces) containing two packages:

| Package | npm | What it is |
| --- | --- | --- |
| [`@architectcms/sdk`](./packages/sdk) | [![npm](https://img.shields.io/npm/v/@architectcms/sdk.svg)](https://www.npmjs.com/package/@architectcms/sdk) | TypeScript SDK: `ArchitectDelivery`, `ArchitectPreview`, and `ArchitectManagement` clients plus type generation. Zero runtime dependencies. |
| [`@architectcms/cli`](./packages/cli) | [![npm](https://img.shields.io/npm/v/@architectcms/cli.svg)](https://www.npmjs.com/package/@architectcms/cli) | The `architect` command — a thin wrapper around the SDK for managing models, entries, and types from the terminal. |

The CLI does **no direct HTTP** — every API call goes through `@architectcms/sdk`, and it authenticates with a management API key just like the SDK.

## Install

```bash
# SDK — for your application code
npm install @architectcms/sdk

# CLI — installs the `architect` command
npm install -g @architectcms/cli
```

## Quick start

```typescript
import { ArchitectDelivery } from '@architectcms/sdk';

const client = new ArchitectDelivery({
  apiKey: 'arch_delivery_...',
  organizationId: 'org_123',
  environmentId: 'env_prod',
  baseUrl: 'https://api.architectcms.com',
});

const posts = await client.entries.model('blog-post').fetch();
```

```bash
architect login                  # authenticate with a management key
architect models pull            # fetch your content models
architect types generate         # generate TypeScript types
```

## Documentation

- **SDK reference** — [`packages/sdk/README.md`](./packages/sdk/README.md): clients, context-aware content, preview mode, management CRUD, type generation, filter operators.
- **CLI reference** — [`packages/cli/README.md`](./packages/cli/README.md): commands, `architect init`, configuration, and authentication.

## Development

This repo uses npm workspaces, [tsup](https://tsup.egoist.dev/) for builds, [Vitest](https://vitest.dev/) for tests, and [Changesets](https://github.com/changesets/changesets) for releases.

```bash
npm install            # install workspaces
npm run build          # build both packages
npm test               # run all tests
npm run lint           # typecheck both packages
```

### Contributing

- Use [Conventional Commits](https://www.conventionalcommits.org/) for messages (`feat(scope): …`, `fix: …`, `chore: …`).
- Add a Changeset for every user-facing change: `npx changeset`, pick the package(s) and bump, and write a one-line summary. Releases are driven by Changesets — do not hand-edit versions.
- Keep the CLI a pure SDK wrapper: if the CLI needs a new API call, add it to the SDK first.

## Requirements

- Node.js 18+ (the SDK uses native `fetch`)
- An Architect CMS API key

## License

MIT
