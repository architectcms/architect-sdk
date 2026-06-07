import { describe, it, expect, vi } from 'vitest'
import { scaffoldLocalization, runScaffold } from '../../src/init/scaffold'
import type { LocalizationConfig } from '../../src/init/config-schema'

function fakeClient() {
  let entrySeq = 0
  const created: any[] = []
  const client = {
    models: {
      create: vi.fn().mockImplementation(async (d: any) => {
        created.push(d)
        return { id: 'mdl_locale', name: d.name, fields: [] }
      }),
      addField: vi.fn().mockResolvedValue({ id: 'mdl_locale' }),
    },
    entries: {
      create: vi.fn().mockImplementation(async (modelId: string, data: any) => ({
        id: `ent_${data.code}_${entrySeq++}`,
        modelId,
        data,
      })),
    },
    contexts: { create: vi.fn().mockResolvedValue({ id: 'ctx_loc' }) },
    bundles: { install: vi.fn().mockResolvedValue({ installed: 1 }) },
  } as any
  return client
}

const hierConfig: LocalizationConfig = {
  enabled: true,
  locales: [
    { code: 'en-US', name: 'English (US)' },
    { code: 'fr-FR', name: 'French (France)' },
  ],
  defaultLocale: 'en',
  hierarchy: true,
}

describe('scaffoldLocalization', () => {
  it('creates a context model with keyField=code and isContextModel', async () => {
    const client = fakeClient()
    await scaffoldLocalization(client, hierConfig)
    expect(client.models.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Locale',
        isContextModel: true,
        keyField: 'code',
        fields: expect.arrayContaining([
          expect.objectContaining({ name: 'code', type: 'text' }),
          expect.objectContaining({ name: 'name', type: 'text' }),
        ]),
      }),
    )
  })

  it('adds a self-referencing parent relation when hierarchy is on', async () => {
    const client = fakeClient()
    await scaffoldLocalization(client, hierConfig)
    expect(client.models.addField).toHaveBeenCalledWith('mdl_locale', {
      name: 'parent',
      displayName: 'Parent',
      type: 'model',
      targetModelIds: ['mdl_locale'],
      multiple: false,
    })
  })

  it('seeds base languages before regions and links children to parents', async () => {
    const client = fakeClient()
    await scaffoldLocalization(client, hierConfig)
    const codes = client.entries.create.mock.calls.map((c: any[]) => c[1].code)
    // 2 regions + 2 derived bases = 4 entries
    expect(codes).toHaveLength(4)
    expect(codes.indexOf('fr')).toBeLessThan(codes.indexOf('fr-FR'))
    // The region entry got a parent id pointing at the base entry.
    const frRegion = client.entries.create.mock.calls.find((c: any[]) => c[1].code === 'fr-FR')
    expect(frRegion[1].parent).toMatch(/^ent_fr_/)
  })

  it('creates a context provider with empty derivationPath and parent hierarchyRelations', async () => {
    const client = fakeClient()
    await scaffoldLocalization(client, hierConfig)
    expect(client.contexts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceModelId: 'mdl_locale',
        derivationPath: [],
        hierarchyRelations: ['parent'],
      }),
    )
  })

  it('omits the parent relation and uses null hierarchyRelations when flat', async () => {
    const client = fakeClient()
    await scaffoldLocalization(client, { ...hierConfig, hierarchy: false })
    expect(client.models.addField).not.toHaveBeenCalled()
    expect(client.contexts.create).toHaveBeenCalledWith(
      expect.objectContaining({ hierarchyRelations: null }),
    )
  })
})

describe('runScaffold', () => {
  it('runs starter models, localization, and bundles from a config', async () => {
    const client = fakeClient()
    const summary = await runScaffold(client, {
      starterModels: [{ name: 'Article', fields: [{ name: 'title', type: 'text' }] }],
      localization: hierConfig,
      bundles: ['bnd_blog'],
    })
    expect(summary.starterModels).toEqual(['Article'])
    expect(summary.localization?.localesCreated).toBe(4)
    expect(summary.bundles).toEqual(['bnd_blog'])
    expect(client.bundles.install).toHaveBeenCalledWith('bnd_blog')
  })

  it('does nothing for an empty config', async () => {
    const client = fakeClient()
    const summary = await runScaffold(client, {})
    expect(summary).toEqual({ starterModels: [], bundles: [] })
    expect(client.models.create).not.toHaveBeenCalled()
  })
})
