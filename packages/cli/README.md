# @architectcms/cli

Command-line tool for [Architect CMS](https://architectcms.com). Authenticate, bootstrap a workspace, and manage your content models and entries — all from the terminal.

The CLI is a thin wrapper around [`@architectcms/sdk`](../sdk): every API call goes through the SDK, and it authenticates with a management API key just like the SDK. It performs no direct HTTP of its own.

## Install

```bash
npm install -g @architectcms/cli
```

This installs the `architect` command.

## Quickstart

```bash
# 1. Log in with a management key created in the web app.
#    Prompts for the key + org/env, or pass them as flags (CI-friendly).
architect login

# 2. Confirm your session.
architect whoami

# 3. Pull your models / entries.
architect models pull --out architect/models.json
architect entries pull --model Article --out architect/articles.json

# 4. Push changes back (create or update).
architect models push architect/models.json
architect entries push --model Article architect/articles.json

# 5. Generate TypeScript types.
architect types generate --output ./architect-types.ts
```

## Commands

| Command | Description |
| --- | --- |
| `architect login [--api-key <key>] [--organization-id <id>] [--environment-id <id>] [--base-url <url>]` | Authenticate with a management API key (prompts for anything not passed). |
| `architect whoami` | Show the current login and verify the key still works. |
| `architect logout` | Remove stored credentials. |
| `architect models pull [--out <file>]` | Fetch all models (writes JSON to a file or stdout). |
| `architect models push <file>` | Create/update models from a JSON file (matched by id or name). |
| `architect entries pull --model <name> [--out <file>]` | Fetch entries for a model. |
| `architect entries push --model <name> <file>` | Upsert entries (entries with an `id` are updated; others created). |
| `architect types generate [--output <file>]` | Generate TypeScript types for your models. |
| `architect init [--config <file>] [--yes]` | Bootstrap a workspace: starter models, localization, bundles. |
| `architect contexts list` | List context providers. |
| `architect contexts get <id>` | Show one context provider. |
| `architect contexts pull [--out <file>]` | Fetch all context providers as JSON. |
| `architect contexts push <file>` | Create/update context providers from JSON. |
| `architect context-actions list --provider <id>` | List context actions for a provider. |
| `architect context-actions run <id> --entry <entryId> --context-value <value> [--model <modelId>]` | Execute a context action on an entry. |
| `architect env list` | List environments. |
| `architect env create --name <displayName> [--promotes-to <id>]` | Create an environment, optionally with a promotion target. |
| `architect lifecycle list --model <name>` | List lifecycle functions for a model. |
| `architect lifecycle add --model <name> --name <name> --events <list> --code-file <path> [--timing before\|after]` | Add a lifecycle function. |
| `architect lifecycle rm <id>` | Remove a lifecycle function. |
| `architect webhooks list` | List webhooks. |
| `architect webhooks add --name <name> --url <url> --events <list>` | Add a webhook. |
| `architect webhooks test <id>` | Send a test delivery. |
| `architect webhooks rm <id>` | Delete a webhook. |

Add `--json` to any command for machine-readable output.

## `architect init`

`init` walks you from nothing to a ready workspace. It runs **interactively** (prompts) or **from a config file**, so the same setup is reproducible in CI:

```bash
architect init                              # fully interactive
architect init --config init.json           # non-interactive from a file
architect init --config init.json --yes      # CI: no prompts at all
```

See [`examples/init.fr-en.json`](./examples/init.fr-en.json) for the config shape. It can scaffold:

- **Starter models** — created via the SDK.
- **Localization** — a `Locale` context model (key field `code`), seeded locale entries, and a context provider. With `hierarchy: true`, region locales (`fr-FR`) fall back to their base language (`fr`) via a self-referencing `parent` relation. Resolution is most-specific-first (the Architect server has no configurable policy knob).
- **Bundles** — installed into the target environment.

## Context providers

Context providers drive audience segmentation / data enrichment. Pull and push
them as JSON, the same workflow as models and entries:

```bash
architect contexts list
architect contexts get ctx_region
architect contexts pull --out architect/contexts.json
architect contexts push architect/contexts.json
```

## Context actions

Operations bound to a provider (e.g. "translate to locale") that produce
context-specific content for an entry:

```bash
# List the actions defined on a provider
architect context-actions list --provider ctx_locale

# Run an action against an entry under a given context value
architect context-actions run action_translate \
  --entry entry_123 \
  --context-value fr-FR \
  --model Article
```

## Environments

```bash
architect env list

# Create an environment; --promotes-to wires a promotion target (staging → prod)
architect env create --name Staging --promotes-to env_prod
```

## Lifecycle functions

Server-side handlers that run before/after entry events. `--events` is a
comma-separated list of `onCreate` / `onUpdate` / `onDelete`; `--timing` is
`before` or `after` (default `after`; `onDelete` supports `after` only). The
`--code-file` must define `function handler(entry, context, services)`.

```bash
architect lifecycle list --model Article

# slug.js: function handler(entry, context, services) { … return { entry } }
architect lifecycle add \
  --model Article \
  --name slugify \
  --events onCreate,onUpdate \
  --timing before \
  --code-file ./slug.js

architect lifecycle rm fn_123
```

## Webhooks

`--events` is a comma-separated list of `object.action` pairs (e.g.
`entry.published`, `model.updated`).

```bash
architect webhooks list

architect webhooks add \
  --name "Notify build" \
  --url https://example.com/hooks/architect \
  --events entry.published,entry.deleted

architect webhooks test wh_123    # send a sample delivery
architect webhooks rm wh_123
```

## Configuration

Resolution precedence: **flags > environment variables > config file > built-in default**.

| Setting | Flag | Env var | Default |
| --- | --- | --- | --- |
| API base URL | `--base-url` | `ARCHITECT_BASE_URL` | `https://api.architectcms.com` |
| API key | — | `ARCHITECT_API_KEY` | (from credentials) |
| Organization | `--organization-id` | `ARCHITECT_ORG` | (from credentials) |
| Environment | `--environment-id` | `ARCHITECT_ENV` | (from credentials) |

Credentials are stored at `~/.architect/credentials.json` with `0600` permissions.

### Authentication

The CLI authenticates with a **management API key** (`arch_mgmt_…`) — the same key model the SDK uses. Create one in the web app, then run `architect login` (or pass `--api-key`/`--organization-id`/`--environment-id` for non-interactive/CI use). The CLI talks to the API only through `@architectcms/sdk`; there is no browser/OAuth flow.
