/**
 * Shape of the `architect init` config file (`--config`) — and the in-memory
 * shape the interactive prompts fill. Every field has a config equivalent so
 * `architect init --config <file> --yes` is fully non-interactive (CI-friendly).
 */

export interface LocaleInput {
  /** Locale code, e.g. "en-US" or "fr". Used as the keyField value. */
  code: string
  /** Display name, e.g. "English (US)". */
  name: string
  /** Code of the fallback/parent locale (for hierarchy). Derived from `code` if omitted. */
  parent?: string
}

export interface LocalizationConfig {
  enabled: boolean
  /** Context model name. Default: "Locale". */
  modelName?: string
  /** Context provider name. Default: "Localization". */
  providerName?: string
  locales: LocaleInput[]
  /** Code of the default/root fallback locale; must resolve to one of `locales`. */
  defaultLocale: string
  /**
   * Model a language→region hierarchy so a missing region value (fr-FR) falls
   * back to its base language (fr), then to the default. Implemented via a
   * self-referencing `parent` relation + the provider's `hierarchyRelations`.
   */
  hierarchy: boolean
  /**
   * Reserved. The Architect server resolves context values most-specific-first
   * (walking the parent chain); there is no configurable policy knob, so this is
   * accepted for forward-compatibility but not sent to the API.
   */
  policy?: 'mostSpecific' | 'firstHit' | 'merge'
}

export interface StarterModelInput {
  name: string
  displayName?: string
  description?: string
  fields?: Array<Record<string, unknown>>
  keyField?: string
  isContextModel?: boolean
}

export interface InitConfig {
  org?: { name: string }
  starterModels?: StarterModelInput[]
  localization?: LocalizationConfig
  /** Marketplace bundle ids to install into the target environment. */
  bundles?: string[]
}
