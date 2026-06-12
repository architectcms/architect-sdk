import { describe, it, expect, vi } from 'vitest'
import { runContextActionsList, runContextActionExecute } from '../../src/commands/context-actions'

function fakeClient() {
  return {
    contextActions: {
      list: vi.fn().mockResolvedValue([{ id: 'ca1', name: 'Translate' }]),
      execute: vi.fn().mockResolvedValue({ modifiedEntry: { id: 'e1' }, executionTime: 5 }),
    },
  } as any
}

describe('context-actions', () => {
  it('lists actions for a provider', async () => {
    const client = fakeClient()
    expect(await runContextActionsList(client, 'localization')).toHaveLength(1)
    expect(client.contextActions.list).toHaveBeenCalledWith('localization')
  })

  it('executes with entryId, contextValue and optional modelId', async () => {
    const client = fakeClient()
    const result = await runContextActionExecute(client, 'ca1', { entryId: 'e1', contextValue: 'fr-FR', modelId: 'article' })
    expect(client.contextActions.execute).toHaveBeenCalledWith('ca1', { entryId: 'e1', contextValue: 'fr-FR', modelId: 'article' })
    expect(result).toEqual({ modifiedEntry: { id: 'e1' }, executionTime: 5 })
  })
})
