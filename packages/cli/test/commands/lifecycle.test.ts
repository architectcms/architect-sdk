import { describe, it, expect, vi } from 'vitest'
import { runLifecycleList, runLifecycleAdd } from '../../src/commands/lifecycle'

function fakeClient() {
  return {
    lifecycle: {
      list: vi.fn().mockResolvedValue([{ id: 'fn1', events: ['onCreate'] }]),
      create: vi.fn().mockImplementation(async (_m: string, d: any) => ({ id: 'fn2', ...d })),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  } as any
}

describe('lifecycle', () => {
  it('lists functions for a model', async () => {
    const client = fakeClient()
    expect(await runLifecycleList(client, 'article')).toHaveLength(1)
    expect(client.lifecycle.list).toHaveBeenCalledWith('article')
  })

  it('adds a function (parses comma-separated events, applies timing to each)', async () => {
    const client = fakeClient()
    await runLifecycleAdd(client, 'article', {
      name: 'Slugify',
      events: 'onCreate,onUpdate',
      timing: 'before',
      code: 'entry.data.x = 1',
    })
    expect(client.lifecycle.create).toHaveBeenCalledWith('article', {
      name: 'Slugify',
      events: ['onCreate', 'onUpdate'],
      eventTiming: { onCreate: 'before', onUpdate: 'before' },
      code: 'entry.data.x = 1',
      enabled: true,
    })
  })

  it('rejects invalid events', async () => {
    const client = fakeClient()
    await expect(
      runLifecycleAdd(client, 'article', { name: 'X', events: 'beforeSave', timing: 'after', code: 'x' }),
    ).rejects.toThrow(/Invalid lifecycle event/)
    expect(client.lifecycle.create).not.toHaveBeenCalled()
  })
})
