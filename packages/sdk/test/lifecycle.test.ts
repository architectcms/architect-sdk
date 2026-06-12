import { describe, it, expect, vi } from 'vitest'
import { LifecycleResource } from '../src/resources/lifecycle'

describe('LifecycleResource', () => {
  it('lists functions for a model', async () => {
    const http = { get: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'fn1', events: ['onCreate'] }] }), post: vi.fn(), put: vi.fn(), del: vi.fn() } as any
    const lc = new LifecycleResource(http)
    const list = await lc.list('article')
    expect(http.get).toHaveBeenCalledWith('/api/models/article/lifecycle-functions')
    expect(list).toEqual([{ id: 'fn1', events: ['onCreate'] }])
  })

  it('gets a function by id (not model-scoped)', async () => {
    const http = { get: vi.fn().mockResolvedValue({ success: true, data: { id: 'fn1' } }), post: vi.fn(), put: vi.fn(), del: vi.fn() } as any
    const lc = new LifecycleResource(http)
    const fn = await lc.get('fn1')
    expect(http.get).toHaveBeenCalledWith('/api/lifecycle-functions/fn1')
    expect(fn).toEqual({ id: 'fn1' })
  })

  it('creates a function on a model', async () => {
    const http = { get: vi.fn(), post: vi.fn().mockResolvedValue({ success: true, data: { id: 'fn2' } }), put: vi.fn(), del: vi.fn() } as any
    const lc = new LifecycleResource(http)
    const data = {
      name: 'Slugify',
      code: 'entry.data.slug = slugify(entry.data.title)',
      events: ['onCreate' as const, 'onUpdate' as const],
      eventTiming: { onCreate: 'before' as const, onUpdate: 'before' as const },
      enabled: true,
    }
    const created = await lc.create('article', data)
    expect(http.post).toHaveBeenCalledWith('/api/models/article/lifecycle-functions', data)
    expect(created).toEqual({ id: 'fn2' })
  })

  it('updates a function by id (not model-scoped)', async () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn().mockResolvedValue({ success: true, data: { id: 'fn1', enabled: false } }), del: vi.fn() } as any
    const lc = new LifecycleResource(http)
    const updated = await lc.update('fn1', { enabled: false })
    expect(http.put).toHaveBeenCalledWith('/api/lifecycle-functions/fn1', { enabled: false })
    expect(updated).toEqual({ id: 'fn1', enabled: false })
  })

  it('deletes a function by id (not model-scoped)', async () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn().mockResolvedValue({ success: true, message: 'deleted' }) } as any
    const lc = new LifecycleResource(http)
    await lc.delete('fn1')
    expect(http.del).toHaveBeenCalledWith('/api/lifecycle-functions/fn1')
  })
})
