# @architectcms/cli

## 0.2.0

### Minor Changes

- 1c32511: Add `architect context-actions` command: list actions per provider and execute an action on an entry
- 0047f7d: Add `architect contexts` command: list, get, pull, push context providers
- 2a79bda: Add `architect env` command: list and create environments
- 300420f: Add `architect lifecycle` command: list, add, and remove model lifecycle functions
- f8575e8: Add `architect webhooks` command: list, add, test, and remove webhooks

### Patch Changes

- Updated dependencies [2feb1aa]
- Updated dependencies [ab34b24]
- Updated dependencies [b07f9d3]
- Updated dependencies [ff4c799]
  - @architectcms/sdk@0.3.0

## 0.1.1

### Patch Changes

- c2a620c: Fix `architect --version` to report the installed package version (it was hardcoded to `0.0.0`).
- Updated dependencies [c2a620c]
  - @architectcms/sdk@0.2.1

## 0.1.0

### Minor Changes

- 04dbfc7: Initial release of `@architectcms/cli` — the `architect` command-line tool. A thin wrapper around `@architectcms/sdk` (no direct HTTP; authenticates with a management API key, same as the SDK) providing: `login`, `whoami`, `logout`, `models pull/push`, `entries pull/push`, `types generate`, and a guided `init` (interactive or `--config`/`--yes`) that scaffolds starter models, localization (context model + locale entries + provider), and bundle installs.

### Patch Changes

- Updated dependencies [3798e7c]
- Updated dependencies [665c6f5]
- Updated dependencies [dc1aaab]
  - @architectcms/sdk@0.2.0
