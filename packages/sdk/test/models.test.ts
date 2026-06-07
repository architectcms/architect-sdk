import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ModelsResource } from '../src/resources/models'
import { HttpClient } from '../src/http'

vi.mock('../src/http')

describe('ModelsResource', () => {
  let models: ModelsResource
  let mockGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGet = vi.fn()
    const httpClient = { get: mockGet } as unknown as HttpClient
    models = new ModelsResource(httpClient)
  })

  test('list() calls correct endpoint', async () => {
    mockGet.mockResolvedValue([{ id: 'model_1', name: 'blog-post', fields: [] }])

    const result = await models.list()

    expect(mockGet).toHaveBeenCalledWith('/api/models')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('blog-post')
  })

  test('get() calls correct endpoint with ID', async () => {
    mockGet.mockResolvedValue({ id: 'model_1', name: 'blog-post', fields: [] })

    const result = await models.get('model_1')

    expect(mockGet).toHaveBeenCalledWith('/api/models/model_1')
    expect(result.id).toBe('model_1')
  })

  test('get() works with model name', async () => {
    mockGet.mockResolvedValue({ id: 'model_1', name: 'blog-post', fields: [] })

    await models.get('blog-post')

    expect(mockGet).toHaveBeenCalledWith('/api/models/blog-post')
  })
})
