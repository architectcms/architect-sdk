import { describe, it, expect, vi } from 'vitest'
import { WebhooksResource } from '../src/resources/webhooks'

describe('WebhooksResource', () => {
  it('lists webhooks', async () => {
    const http = { get: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'wh1' }] }), post: vi.fn(), put: vi.fn(), del: vi.fn() } as any
    const wh = new WebhooksResource(http)
    expect(await wh.list()).toEqual([{ id: 'wh1' }])
    expect(http.get).toHaveBeenCalledWith('/api/webhooks')
  })

  it('gets a webhook by id', async () => {
    const http = { get: vi.fn().mockResolvedValue({ success: true, data: { id: 'wh1', url: 'https://x' } }), post: vi.fn(), put: vi.fn(), del: vi.fn() } as any
    const wh = new WebhooksResource(http)
    expect(await wh.get('wh1')).toEqual({ id: 'wh1', url: 'https://x' })
    expect(http.get).toHaveBeenCalledWith('/api/webhooks/wh1')
  })

  it('creates a webhook (server shape: name + triggers)', async () => {
    const http = { get: vi.fn(), post: vi.fn().mockResolvedValue({ success: true, data: { id: 'wh2' } }), put: vi.fn(), del: vi.fn() } as any
    const wh = new WebhooksResource(http)
    const created = await wh.create({ name: 'Notify', url: 'https://x', triggers: [{ type: 'entry', action: 'published' }], enabled: true })
    expect(http.post).toHaveBeenCalledWith('/api/webhooks', { name: 'Notify', url: 'https://x', triggers: [{ type: 'entry', action: 'published' }], enabled: true })
    expect(created).toEqual({ id: 'wh2' })
  })

  it('updates a webhook', async () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn().mockResolvedValue({ success: true, data: { id: 'wh1', enabled: false } }), del: vi.fn() } as any
    const wh = new WebhooksResource(http)
    expect(await wh.update('wh1', { enabled: false })).toEqual({ id: 'wh1', enabled: false })
    expect(http.put).toHaveBeenCalledWith('/api/webhooks/wh1', { enabled: false })
  })

  it('deletes a webhook', async () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn().mockResolvedValue({ success: true, message: 'deleted' }) } as any
    const wh = new WebhooksResource(http)
    await wh.delete('wh1')
    expect(http.del).toHaveBeenCalledWith('/api/webhooks/wh1')
  })

  it('tests a webhook', async () => {
    const http = { get: vi.fn(), post: vi.fn().mockResolvedValue({ success: true, data: { delivered: true } }), put: vi.fn(), del: vi.fn() } as any
    const wh = new WebhooksResource(http)
    expect(await wh.test('wh1')).toEqual({ delivered: true })
    expect(http.post).toHaveBeenCalledWith('/api/webhooks/wh1/test', {})
  })
})
