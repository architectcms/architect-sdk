# @architectcms/sdk

## 0.2.0

### Minor Changes

- 3798e7c: Add a `bundles` resource to `ArchitectManagement` with `list()` and `install(bundleId, options?)`. The install target organization/environment are resolved server-side from the client's request headers; the options body is forwarded to the install endpoint.
- 665c6f5: Extend `models.create` to accept context-model properties (`keyField`, `isContextModel`, `type`, `category`, `displayName`), and widen the `Field` type to include `text`/`model`/`key`/`select` types plus `targetModelIds`/`exclusive`/`displayName`. Enables creating context source models (e.g. for localization) through the SDK.
- dc1aaab: Export `generateTypes` from the package entrypoint so consumers (including the CLI) can generate TypeScript types from models programmatically.
