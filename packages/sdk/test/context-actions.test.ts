import { describe, it, expect, vi } from 'vitest'
import { ContextActionsResource } from '../src/resources/context-actions'

describe('ContextActionsResource', () => {
  it('lists actions for a context provider', async () => {
    const http = { get: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'ca1' }] }), post: vi.fn(), put: vi.fn(), del: vi.fn() } as any
    const ca = new ContextActionsResource(http)
    expect(await ca.list('localization')).toEqual([{ id: 'ca1' }])
    expect(http.get).toHaveBeenCalledWith('/api/context-providers/localization/context-actions')
  })

  it('gets an action by id', async () => {
    const http = { get: vi.fn().mockResolvedValue({ success: true, data: { id: 'ca1', name: 'Translate' } }), post: vi.fn(), put: vi.fn(), del: vi.fn() } as any
    const ca = new ContextActionsResource(http)
    expect(await ca.get('ca1')).toEqual({ id: 'ca1', name: 'Translate' })
    expect(http.get).toHaveBeenCalledWith('/api/context-actions/ca1')
  })

  it('creates an action under a provider', async () => {
    const http = { get: vi.fn(), post: vi.fn().mockResolvedValue({ success: true, data: { id: 'ca2' } }), put: vi.fn(), del: vi.fn() } as any
    const ca = new ContextActionsResource(http)
    const created = await ca.create('localization', { name: 'Translate', code: 'return entry' })
    expect(http.post).toHaveBeenCalledWith('/api/context-providers/localization/context-actions', { name: 'Translate', code: 'return entry' })
    expect(created).toEqual({ id: 'ca2' })
  })

  it('updates an action by id', async () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn().mockResolvedValue({ success: true, data: { id: 'ca1', enabled: false } }), del: vi.fn() } as any
    const ca = new ContextActionsResource(http)
    expect(await ca.update('ca1', { enabled: false })).toEqual({ id: 'ca1', enabled: false })
    expect(http.put).toHaveBeenCalledWith('/api/context-actions/ca1', { enabled: false })
  })

  it('deletes an action by id', async () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn().mockResolvedValue({ success: true, message: 'deleted' }) } as any
    const ca = new ContextActionsResource(http)
    await ca.delete('ca1')
    expect(http.del).toHaveBeenCalledWith('/api/context-actions/ca1')
  })

  it('executes an action with entryId and contextValue', async () => {
    const http = { get: vi.fn(), post: vi.fn().mockResolvedValue({ success: true, data: { modifiedEntry: { id: 'e1' }, executionTime: 5 } }), put: vi.fn(), del: vi.fn() } as any
    const ca = new ContextActionsResource(http)
    const result = await ca.execute('ca1', { entryId: 'e1', contextValue: 'fr-FR', modelId: 'article' })
    expect(http.post).toHaveBeenCalledWith('/api/context-actions/ca1/execute', { entryId: 'e1', contextValue: 'fr-FR', modelId: 'article' })
    expect(result).toEqual({ modifiedEntry: { id: 'e1' }, executionTime: 5 })
  })
})
