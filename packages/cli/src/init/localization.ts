import type { LocaleInput, LocalizationConfig } from './config-schema'

/**
 * Expand a localization config into the full, creation-ordered locale list.
 *
 * When `hierarchy` is true, derive each region's parent from its code
 * (`fr-FR` → `fr`), creating the base-language locale if it's missing, so a
 * missing `fr-FR` value falls back to `fr`. The returned list is ordered
 * parents-before-children so relation links can be set as entries are created.
 *
 * When `hierarchy` is false, all parent links are stripped (flat localization).
 */
export function expandLocales(config: Pick<LocalizationConfig, 'locales' | 'hierarchy'>): LocaleInput[] {
  const byCode = new Map<string, LocaleInput>()
  for (const l of config.locales) {
    byCode.set(l.code, { code: l.code, name: l.name, ...(l.parent ? { parent: l.parent } : {}) })
  }

  if (config.hierarchy) {
    for (const l of [...byCode.values()]) {
      if (l.parent) continue
      const base = l.code.split('-')[0]
      if (base !== l.code) {
        l.parent = base
        if (!byCode.has(base)) {
          byCode.set(base, { code: base, name: base })
        }
      }
    }
  } else {
    for (const l of byCode.values()) delete l.parent
  }

  return orderParentsFirst([...byCode.values()])
}

/** Topologically order locales so a parent always precedes its children. */
function orderParentsFirst(locales: LocaleInput[]): LocaleInput[] {
  const placed = new Set<string>()
  const ordered: LocaleInput[] = []
  let remaining = [...locales]
  // Bounded iterations guard against cycles in malformed input.
  for (let guard = 0; guard < locales.length + 1 && remaining.length > 0; guard++) {
    const ready = remaining.filter(l => !l.parent || placed.has(l.parent))
    if (ready.length === 0) {
      // Parent references something not in the set (or a cycle) — append as-is.
      ordered.push(...remaining)
      break
    }
    for (const l of ready) {
      ordered.push(l)
      placed.add(l.code)
    }
    remaining = remaining.filter(l => !placed.has(l.code))
  }
  return ordered
}

/** Validate a localization config, returning a list of human-readable problems. */
export function validateLocalization(config: LocalizationConfig): string[] {
  const errors: string[] = []
  if (!config.enabled) return errors
  if (!config.locales || config.locales.length === 0) {
    errors.push('At least one locale is required when localization is enabled.')
  }
  const codes = new Set(config.locales?.map(l => l.code))
  if (config.defaultLocale && !codes.has(config.defaultLocale)) {
    // After expansion the default may be a derived base language; check both.
    const expandedCodes = new Set(expandLocales(config).map(l => l.code))
    if (!expandedCodes.has(config.defaultLocale)) {
      errors.push(`defaultLocale "${config.defaultLocale}" is not one of the configured locales.`)
    }
  }
  if (!config.defaultLocale) {
    errors.push('A defaultLocale is required when localization is enabled.')
  }
  return errors
}
