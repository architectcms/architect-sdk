---
"@architectcms/sdk": minor
---

Add a `bundles` resource to `ArchitectManagement` with `list()` and `install(bundleId, options?)`. The install target organization/environment are resolved server-side from the client's request headers; the options body is forwarded to the install endpoint.
