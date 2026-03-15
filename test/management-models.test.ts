import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ManagementModelsResource } from '../src/resources/management-models'
import { HttpClient } from '../src/http'

describe('ManagementModelsResource', () => {
  let models: ManagementModelsResource
  let mockGet: ReturnType<typeof vi.fn>
  let mockPost: ReturnType<typeof vi.fn>
  let mockPut: ReturnType<typeof vi.fn>
  let mockDel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGet = vi.fn().mockResolvedValue([])
    mockPost = vi.fn().mockResolvedValue({ id: 'model_1', name: 'blog', fields: [] })
    mockPut = vi.fn().mockResolvedValue({ id: 'model_1', name: 'blog', fields: [] })
    mockDel = vi.fn().mockResolvedValue({})
    const httpClient = { get: mockGet, post: mockPost, put: mockPut, del: mockDel } as unknown as HttpClient
    models = new ManagementModelsResource(httpClient)
  })

  test('list() works (inherited)', async () => {
    mockGet.mockResolvedValue([{ id: 'model_1', name: 'blog' }])
    const result = await models.list()
    expect(mockGet).toHaveBeenCalledWith('/api/models')
    expect(result).toHaveLength(1)
  })

  test('get() works (inherited)', async () => {
    mockGet.mockResolvedValue({ id: 'model_1', name: 'blog' })
    await models.get('model_1')
    expect(mockGet).toHaveBeenCalledWith('/api/models/model_1')
  })

  test('create() sends POST', async () => {
    await models.create({ name: 'blog-post', description: 'Blog', fields: [] })
    expect(mockPost).toHaveBeenCalledWith('/api/models', {
      name: 'blog-post',
      description: 'Blog',
      fields: [],
    })
  })

  test('update() sends PUT', async () => {
    await models.update('model_1', { description: 'Updated' })
    expect(mockPut).toHaveBeenCalledWith('/api/models/model_1', { description: 'Updated' })
  })

  test('delete() sends DELETE', async () => {
    await models.delete('model_1')
    expect(mockDel).toHaveBeenCalledWith('/api/models/model_1')
  })

  test('addField() sends POST', async () => {
    await models.addField('model_1', { name: 'tags', type: 'text' })
    expect(mockPost).toHaveBeenCalledWith('/api/models/model_1/fields', {
      name: 'tags',
      type: 'text',
    })
  })

  test('updateField() sends PUT', async () => {
    await models.updateField('model_1', 'tags', { required: true })
    expect(mockPut).toHaveBeenCalledWith('/api/models/model_1/fields/tags', { required: true })
  })

  test('deleteField() sends DELETE', async () => {
    await models.deleteField('model_1', 'tags')
    expect(mockDel).toHaveBeenCalledWith('/api/models/model_1/fields/tags')
  })
})
