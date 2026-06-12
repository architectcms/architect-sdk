---
"@architectcms/sdk": minor
---

Extend `models.create` to accept context-model properties (`keyField`, `isContextModel`, `type`, `category`, `displayName`), and widen the `Field` type to include `text`/`model`/`key`/`select` types plus `targetModelIds`/`exclusive`/`displayName`. Enables creating context source models (e.g. for localization) through the SDK.
