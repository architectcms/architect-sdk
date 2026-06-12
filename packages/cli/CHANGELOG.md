# @architectcms/cli

## 0.1.0

### Minor Changes

- 04dbfc7: Initial release of `@architectcms/cli` — the `architect` command-line tool. A thin wrapper around `@architectcms/sdk` (no direct HTTP; authenticates with a management API key, same as the SDK) providing: `login`, `whoami`, `logout`, `models pull/push`, `entries pull/push`, `types generate`, and a guided `init` (interactive or `--config`/`--yes`) that scaffolds starter models, localization (context model + locale entries + provider), and bundle installs.

### Patch Changes

- Updated dependencies [3798e7c]
- Updated dependencies [665c6f5]
- Updated dependencies [dc1aaab]
  - @architectcms/sdk@0.2.0
