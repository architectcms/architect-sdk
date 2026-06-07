import { describe, it, expect } from 'vitest'
import { expandLocales, validateLocalization } from '../../src/init/localization'
import type { LocalizationConfig } from '../../src/init/config-schema'

describe('expandLocales', () => {
  it('derives base-language parents and orders parents first when hierarchy is on', () => {
    const out = expandLocales({
      hierarchy: true,
      locales: [
        { code: 'fr-FR', name: 'French (France)' },
        { code: 'en-US', name: 'English (US)' },
      ],
    })
    const codes = out.map(l => l.code)
    // Base languages fr and en are synthesized.
    expect(codes).toContain('fr')
    expect(codes).toContain('en')
    // Parents precede children.
    expect(codes.indexOf('fr')).toBeLessThan(codes.indexOf('fr-FR'))
    expect(codes.indexOf('en')).toBeLessThan(codes.indexOf('en-US'))
    // Children link to their base.
    expect(out.find(l => l.code === 'fr-FR')?.parent).toBe('fr')
  })

  it('strips parents when hierarchy is off', () => {
    const out = expandLocales({
      hierarchy: false,
      locales: [{ code: 'fr-FR', name: 'French', parent: 'fr' }],
    })
    expect(out).toHaveLength(1)
    expect(out[0].parent).toBeUndefined()
  })

  it('respects an explicitly provided parent', () => {
    const out = expandLocales({
      hierarchy: true,
      locales: [
        { code: 'fr', name: 'French' },
        { code: 'fr-CA', name: 'French (Canada)', parent: 'fr' },
      ],
    })
    expect(out.find(l => l.code === 'fr-CA')?.parent).toBe('fr')
    expect(out.indexOf(out.find(l => l.code === 'fr')!)).toBeLessThan(
      out.indexOf(out.find(l => l.code === 'fr-CA')!),
    )
  })
})

describe('validateLocalization', () => {
  const base: LocalizationConfig = {
    enabled: true,
    locales: [{ code: 'en-US', name: 'English' }],
    defaultLocale: 'en-US',
    hierarchy: false,
  }

  it('passes a valid config', () => {
    expect(validateLocalization(base)).toEqual([])
  })

  it('accepts a default that is a derived base language under hierarchy', () => {
    expect(validateLocalization({ ...base, hierarchy: true, defaultLocale: 'en' })).toEqual([])
  })

  it('flags a default locale not in the list', () => {
    expect(validateLocalization({ ...base, defaultLocale: 'de-DE' })).toContain(
      'defaultLocale "de-DE" is not one of the configured locales.',
    )
  })

  it('flags missing locales', () => {
    const errs = validateLocalization({ ...base, locales: [], defaultLocale: 'en-US' })
    expect(errs.some(e => e.includes('At least one locale'))).toBe(true)
  })
})
