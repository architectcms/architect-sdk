import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ContextsResource } from '../src/resources/contexts'
import { HttpClient } from '../src/http'

describe('ContextsResource', () => {
  let contexts: ContextsResource
  let mockGet: ReturnType<typeof vi.fn>
  let mockPost: ReturnType<typeof vi.fn>
  let mockPut: ReturnType<typeof vi.fn>
  let mockDel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGet = vi.fn().mockResolvedValue([])
    mockPost = vi.fn().mockResolvedValue({ id: 'ctx_1', name: 'Region' })
    mockPut = vi.fn().mockResolvedValue({ id: 'ctx_1', name: 'Updated Region' })
    mockDel = vi.fn().mockResolvedValue({})
    const httpClient = { get: mockGet, post: mockPost, put: mockPut, del: mockDel } as unknown as HttpClient
    contexts = new ContextsResource(httpClient)
  })

  test('list() calls correct endpoint', async () => {
    mockGet.mockResolvedValue([{ id: 'ctx_1', name: 'Region' }])
    const result = await contexts.list()
    expect(mockGet).toHaveBeenCalledWith('/api/context-providers')
    expect(result).toHaveLength(1)
  })

  test('get() calls correct endpoint', async () => {
    mockGet.mockResolvedValue({ id: 'ctx_1', name: 'Region' })
    const result = await contexts.get('ctx_1')
    expect(mockGet).toHaveBeenCalledWith('/api/context-providers/ctx_1')
    expect(result.name).toBe('Region')
  })

  test('create() sends POST', async () => {
    await contexts.create({ name: 'Region', sourceModelId: 'model_1' })
    expect(mockPost).toHaveBeenCalledWith('/api/context-providers', {
      name: 'Region',
      sourceModelId: 'model_1',
    })
  })

  test('update() sends PUT', async () => {
    await contexts.update('ctx_1', { name: 'Updated Region' })
    expect(mockPut).toHaveBeenCalledWith('/api/context-providers/ctx_1', {
      name: 'Updated Region',
    })
  })

  test('delete() sends DELETE', async () => {
    await contexts.delete('ctx_1')
    expect(mockDel).toHaveBeenCalledWith('/api/context-providers/ctx_1')
  })
})
