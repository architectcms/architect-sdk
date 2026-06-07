# @architect-cms/cli

Command-line tool for [Architect CMS](https://architectcms.com). Authenticate, bootstrap a workspace, and manage your content models and entries — all from the terminal.

The CLI is a thin wrapper around [`@architect-cms/sdk`](../sdk): every content API call goes through the SDK. The only direct HTTP it performs is the auth/onboarding bootstrap (Google login, org creation, key minting).

## Install

```bash
npm install -g @architect-cms/cli
```

This installs the `architect` command.

## Quickstart

```bash
# 1. Log in.
#    Paste a management key created in the web app (works today):
architect login --with-token
#    …or use Google browser login (requires GOOGLE_CLI_CLIENT_ID; see below):
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
| `architect login [--with-token] [--org <name>] [--base-url <url>]` | Authenticate (Google browser login, or `--with-token` to paste a management key). |
| `architect whoami` | Show the current login and verify the key still works. |
| `architect logout` | Remove stored credentials. |
| `architect models pull [--out <file>]` | Fetch all models (writes JSON to a file or stdout). |
| `architect models push <file>` | Create/update models from a JSON file (matched by id or name). |
| `architect entries pull --model <name> [--out <file>]` | Fetch entries for a model. |
| `architect entries push --model <name> <file>` | Upsert entries (entries with an `id` are updated; others created). |
| `architect types generate [--output <file>]` | Generate TypeScript types for your models. |
| `architect init [--config <file>] [--yes]` | Bootstrap a workspace: starter models, localization, bundles. |

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

## Configuration

Resolution precedence: **flags > environment variables > config file > built-in default**.

| Setting | Flag | Env var | Default |
| --- | --- | --- | --- |
| API base URL | `--base-url` | `ARCHITECT_BASE_URL` | `https://api.architectcms.com` |
| API key | — | `ARCHITECT_API_KEY` | (from credentials) |
| Organization | `--organization-id` | `ARCHITECT_ORG` | (from credentials) |
| Environment | `--environment-id` | `ARCHITECT_ENV` | (from credentials) |

Credentials are stored at `~/.architect/credentials.json` with `0600` permissions.

### Google login (preview)

`architect login` (without `--with-token`) opens a browser PKCE flow. It requires:

1. `GOOGLE_CLI_CLIENT_ID` set to a Google **Desktop app** OAuth client id.
2. A server that accepts the CLI client's token audience.

Until both are in place, use `architect login --with-token` with a management key created in the web app.
