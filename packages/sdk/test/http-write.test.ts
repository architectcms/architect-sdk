import { describe, test, expect, vi, beforeEach } from 'vitest'
import { HttpClient } from '../src/http'
import { ArchitectError } from '../src/types/common'

describe('HttpClient write methods', () => {
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

  describe('post()', () => {
    test('sends POST with JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '1', data: {} }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await client.post('/api/entries', { modelId: 'blog', data: { title: 'Hi' } })

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.example.com/api/entries')
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({ modelId: 'blog', data: { title: 'Hi' } })
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(result).toEqual({ id: '1', data: {} })
    })

    test('retries on 5xx', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({ error: 'fail' }) })
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ id: '1' }) })
      vi.stubGlobal('fetch', mockFetch)

      const result = await client.post('/api/entries', {})
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ id: '1' })
    })

    test('does not retry on 4xx', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(client.post('/api/entries', {})).rejects.toThrow(ArchitectError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('put()', () => {
    test('sends PUT with JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '1', data: { title: 'Updated' } }),
      })
      vi.stubGlobal('fetch', mockFetch)

      await client.put('/api/entries/1', { data: { title: 'Updated' } })

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.example.com/api/entries/1')
      expect(options.method).toBe('PUT')
      expect(JSON.parse(options.body)).toEqual({ data: { title: 'Updated' } })
    })
  })

  describe('del()', () => {
    test('sends DELETE with no body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('no body')),
      })
      vi.stubGlobal('fetch', mockFetch)

      await client.del('/api/entries/1')

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.example.com/api/entries/1')
      expect(options.method).toBe('DELETE')
      expect(options.body).toBeUndefined()
    })
  })

  describe('postFormData()', () => {
    test('sends POST with FormData and no Content-Type override', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'asset_1' }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.txt')

      await client.postFormData('/api/v2/assets/upload', formData)

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.example.com/api/v2/assets/upload')
      expect(options.method).toBe('POST')
      expect(options.body).toBe(formData)
      // Content-Type should NOT be set (browser sets it with boundary for multipart)
      expect(options.headers['Content-Type']).toBeUndefined()
    })
  })
})
