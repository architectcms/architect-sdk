import { describe, test, expect, vi, beforeEach } from 'vitest'
import { HttpClient } from '../src/http'
import { ArchitectError } from '../src/types/common'

describe('HttpClient', () => {
  let client: HttpClient

  beforeEach(() => {
    client = new HttpClient({
      baseUrl: 'https://api.example.com',
      apiKey: 'arch_delivery_testkey',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      timeout: 5000,
      retries: 2,
    })
  })

  test('sends correct headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.get('/api/models')

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.example.com/api/models')
    expect(options.headers['X-API-Key']).toBe('arch_delivery_testkey')
    expect(options.headers['X-Organization']).toBe('org_123')
    expect(options.headers['X-Environment']).toBe('env_prod')
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  test('appends query params to URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await client.get('/api/entries', { limit: '10', offset: '20' })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.example.com/api/entries?limit=10&offset=20')
  })

  test('throws ArchitectError on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found', code: 'NOT_FOUND' }),
    }))

    await expect(client.get('/api/entries/999'))
      .rejects.toThrow(ArchitectError)

    try {
      await client.get('/api/entries/999')
    } catch (e) {
      expect((e as ArchitectError).status).toBe(404)
      expect((e as ArchitectError).code).toBe('NOT_FOUND')
    }
  })

  test('does not retry on 4xx errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad request' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(client.get('/api/entries')).rejects.toThrow()
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  test('retries on 5xx errors', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })
    vi.stubGlobal('fetch', mockFetch)

    const result = await client.get('/api/entries')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ data: [] })
  })

  test('retries on network errors', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })
    vi.stubGlobal('fetch', mockFetch)

    const result = await client.get('/api/entries')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ data: [] })
  })

  test('throws after exhausting retries', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(client.get('/api/entries')).rejects.toThrow(ArchitectError)
    // 1 initial + 2 retries = 3 total
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})
