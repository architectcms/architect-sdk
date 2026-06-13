# @architectcms/sdk

## 0.3.0

### Minor Changes

- 2feb1aa: Add context-actions resource (`client.contextActions`): list/create per provider, get/update/delete by id, execute on an entry
- ab34b24: Add environments resource (`client.environments`): list, get, create, update, delete
- b07f9d3: Add lifecycle functions resource (`client.lifecycle`): list/create per model, get/update/delete by function id
- ff4c799: Add webhooks resource (`client.webhooks`): list, get, create, update, delete, test

## 0.2.1

### Patch Changes

- c2a620c: Fix the regeneration hint in generated type files to a valid command (`architect types generate`).

## 0.2.0

### Minor Changes

- 3798e7c: Add a `bundles` resource to `ArchitectManagement` with `list()` and `install(bundleId, options?)`. The install target organization/environment are resolved server-side from the client's request headers; the options body is forwarded to the install endpoint.
- 665c6f5: Extend `models.create` to accept context-model properties (`keyField`, `isContextModel`, `type`, `category`, `displayName`), and widen the `Field` type to include `text`/`model`/`key`/`select` types plus `targetModelIds`/`exclusive`/`displayName`. Enables creating context source models (e.g. for localization) through the SDK.
- dc1aaab: Export `generateTypes` from the package entrypoint so consumers (including the CLI) can generate TypeScript types from models programmatically.
