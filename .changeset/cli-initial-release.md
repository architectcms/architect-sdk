---
"@architectcms/cli": minor
---

Initial release of `@architectcms/cli` — the `architect` command-line tool. A thin wrapper around `@architectcms/sdk` (no direct HTTP; authenticates with a management API key, same as the SDK) providing: `login`, `whoami`, `logout`, `models pull/push`, `entries pull/push`, `types generate`, and a guided `init` (interactive or `--config`/`--yes`) that scaffolds starter models, localization (context model + locale entries + provider), and bundle installs.
