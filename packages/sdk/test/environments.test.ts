import { describe, it, expect, vi } from 'vitest'
import { EnvironmentsResource } from '../src/resources/environments'

describe('EnvironmentsResource', () => {
  it('lists environments (unwraps { data })', async () => {
    const http = { get: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'development' }] }), post: vi.fn(), put: vi.fn(), del: vi.fn() } as any
    const envs = new EnvironmentsResource(http)
    const list = await envs.list()
    expect(http.get).toHaveBeenCalledWith('/api/environments')
    expect(list).toEqual([{ id: 'development' }])
  })

  it('gets an environment by id', async () => {
    const http = { get: vi.fn().mockResolvedValue({ success: true, data: { id: 'production' } }), post: vi.fn(), put: vi.fn(), del: vi.fn() } as any
    const envs = new EnvironmentsResource(http)
    const env = await envs.get('production')
    expect(http.get).toHaveBeenCalledWith('/api/environments/production')
    expect(env).toEqual({ id: 'production' })
  })

  it('creates an environment', async () => {
    const http = { get: vi.fn(), post: vi.fn().mockResolvedValue({ success: true, data: { id: 'staging' } }), put: vi.fn(), del: vi.fn() } as any
    const envs = new EnvironmentsResource(http)
    const created = await envs.create({ displayName: 'Staging', promotesTo: 'production' })
    expect(http.post).toHaveBeenCalledWith('/api/environments', { displayName: 'Staging', promotesTo: 'production' })
    expect(created).toEqual({ id: 'staging' })
  })

  it('updates an environment', async () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn().mockResolvedValue({ success: true, data: { id: 'staging', displayName: 'Stage' } }), del: vi.fn() } as any
    const envs = new EnvironmentsResource(http)
    const updated = await envs.update('staging', { displayName: 'Stage' })
    expect(http.put).toHaveBeenCalledWith('/api/environments/staging', { displayName: 'Stage' })
    expect(updated).toEqual({ id: 'staging', displayName: 'Stage' })
  })

  it('deletes an environment', async () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn().mockResolvedValue({ success: true, message: 'deleted' }) } as any
    const envs = new EnvironmentsResource(http)
    await envs.delete('staging')
    expect(http.del).toHaveBeenCalledWith('/api/environments/staging')
  })
})
