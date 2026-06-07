import { describe, it, expect, vi } from 'vitest'
import { BundlesResource } from '../src/resources/bundles'

describe('BundlesResource', () => {
  it('lists bundles, unwrapping the { success, data } envelope', async () => {
    const http = {
      get: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'bnd_1', name: 'Blog', version: '1.0.0' }] }),
      post: vi.fn(),
    } as any
    const bundles = new BundlesResource(http)
    const list = await bundles.list()
    expect(http.get).toHaveBeenCalledWith('/api/bundles')
    expect(list).toEqual([{ id: 'bnd_1', name: 'Blog', version: '1.0.0' }])
  })

  it('installs a bundle, passing options as the body and unwrapping data', async () => {
    // org/env are taken from request headers (X-Organization / X-Environment),
    // which the HttpClient already sends — so the body carries install options only.
    const http = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({ success: true, data: { installed: 3 } }),
    } as any
    const bundles = new BundlesResource(http)
    const result = await bundles.install('bnd_1', { includeEntries: true })
    expect(http.post).toHaveBeenCalledWith('/api/bundles/bnd_1/install', { includeEntries: true })
    expect(result).toEqual({ installed: 3 })
  })

  it('installs with an empty options body by default', async () => {
    const http = { get: vi.fn(), post: vi.fn().mockResolvedValue({ success: true, data: {} }) } as any
    const bundles = new BundlesResource(http)
    await bundles.install('bnd_2')
    expect(http.post).toHaveBeenCalledWith('/api/bundles/bnd_2/install', {})
  })
})
