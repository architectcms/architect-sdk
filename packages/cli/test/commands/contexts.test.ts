import { describe, it, expect, vi } from 'vitest'
import { runContextsList, runContextsPush } from '../../src/commands/contexts'

function fakeClient(providers: any[] = []) {
  return {
    contexts: {
      list: vi.fn().mockResolvedValue(providers),
      create: vi.fn().mockImplementation(async (d: any) => ({ id: 'new', ...d })),
      update: vi.fn().mockImplementation(async (id: string, d: any) => ({ id, ...d })),
    },
  } as any
}

describe('contexts', () => {
  it('lists providers', async () => {
    const client = fakeClient([{ id: 'localization', displayName: 'Localization' }])
    expect(await runContextsList(client)).toHaveLength(1)
    expect(client.contexts.list).toHaveBeenCalledOnce()
  })

  it('push creates providers without an id and updates those with one', async () => {
    const client = fakeClient()
    const summary = await runContextsPush(client, [
      { name: 'Localization', sourceModelId: 'locale', derivationPath: [] },
      { id: 'segment', name: 'Segment', sourceModelId: 'customer', derivationPath: ['tier'] },
    ])
    expect(client.contexts.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Localization' }))
    expect(client.contexts.update).toHaveBeenCalledWith('segment', expect.objectContaining({ name: 'Segment' }))
    expect(summary).toEqual([{ id: 'new', action: 'create' }, { id: 'segment', action: 'update' }])
  })
})
