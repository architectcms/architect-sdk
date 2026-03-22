import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ManagementEntriesResource } from '../src/resources/management-entries'
import { HttpClient } from '../src/http'

describe('ManagementEntriesResource', () => {
  let entries: ManagementEntriesResource
  let mockGet: ReturnType<typeof vi.fn>
  let mockPost: ReturnType<typeof vi.fn>
  let mockPut: ReturnType<typeof vi.fn>
  let mockDel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGet = vi.fn().mockResolvedValue([])
    mockPost = vi.fn().mockResolvedValue({ id: 'entry_1', data: {} })
    mockPut = vi.fn().mockResolvedValue({ id: 'entry_1', data: {} })
    mockDel = vi.fn().mockResolvedValue({})
    const httpClient = { get: mockGet, post: mockPost, put: mockPut, del: mockDel } as unknown as HttpClient
    entries = new ManagementEntriesResource(httpClient)
  })

  test('get() works (inherited)', async () => {
    mockGet.mockResolvedValue({ id: 'entry_1' })
    const result = await entries.get('entry_1')
    expect(mockGet).toHaveBeenCalledWith('/api/entries/entry_1', undefined)
    expect(result.id).toBe('entry_1')
  })

  test('model() returns query builder (inherited)', () => {
    const query = entries.model('blog-post')
    expect(typeof query.fetch).toBe('function')
  })

  test('create() sends POST with modelId and data', async () => {
    await entries.create('blog-post', { title: 'Hello' })
    expect(mockPost).toHaveBeenCalledWith('/api/entries', {
      modelId: 'blog-post',
      data: { title: 'Hello' },
    })
  })

  test('update() sends PUT with data', async () => {
    await entries.update('entry_1', { title: 'Updated' })
    expect(mockPut).toHaveBeenCalledWith('/api/entries/entry_1', {
      data: { title: 'Updated' },
    })
  })

  test('delete() sends DELETE', async () => {
    await entries.delete('entry_1')
    expect(mockDel).toHaveBeenCalledWith('/api/entries/entry_1')
  })

  test('publish() sends POST', async () => {
    await entries.publish('entry_1')
    expect(mockPost).toHaveBeenCalledWith('/api/entries/entry_1/publish', {})
  })

  test('unpublish() sends POST', async () => {
    await entries.unpublish('entry_1')
    expect(mockPost).toHaveBeenCalledWith('/api/entries/entry_1/unpublish', {})
  })

  test('addRelation() sends POST', async () => {
    await entries.addRelation('entry_1', 'author', 'entry_2')
    expect(mockPost).toHaveBeenCalledWith('/api/entries/entry_1/relationships', {
      fieldName: 'author',
      targetEntryId: 'entry_2',
    })
  })

  test('removeRelation() sends DELETE', async () => {
    await entries.removeRelation('entry_1', 'author', 'entry_2')
    expect(mockDel).toHaveBeenCalledWith('/api/entries/entry_1/relationships/author/entry_2')
  })
})
