import { describe, test, expect, vi, beforeEach } from 'vitest'
import { EntriesResource } from '../src/resources/entries'
import { HttpClient } from '../src/http'

vi.mock('../src/http')

describe('EntriesResource', () => {
  let entries: EntriesResource
  let mockGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGet = vi.fn().mockResolvedValue([])
    const httpClient = { get: mockGet } as unknown as HttpClient
    entries = new EntriesResource(httpClient)
  })

  test('get() calls correct endpoint', async () => {
    mockGet.mockResolvedValue({ id: 'entry_1', modelId: 'blog-post', data: {} })

    const result = await entries.get('entry_1')

    expect(mockGet).toHaveBeenCalledWith('/api/entries/entry_1', undefined)
    expect(result.id).toBe('entry_1')
  })

  test('get() with context passes context as query params', async () => {
    mockGet.mockResolvedValue({ id: 'entry_1', modelId: 'product', data: { price: 99 } })

    await entries.get('entry_1', { loyalty_tier: 'vip', language: 'fr' })

    expect(mockGet).toHaveBeenCalledWith('/api/entries/entry_1', {
      loyalty_tier: 'vip',
      language: 'fr',
    })
  })

  test('get() with empty context passes undefined', async () => {
    mockGet.mockResolvedValue({ id: 'entry_1', modelId: 'product', data: {} })

    await entries.get('entry_1', {})

    expect(mockGet).toHaveBeenCalledWith('/api/entries/entry_1', undefined)
  })

  test('model() returns a query builder', () => {
    const query = entries.model('blog-post')
    expect(query).toBeDefined()
    expect(typeof query.fetch).toBe('function')
  })

  test('builder sends correct model endpoint', async () => {
    await entries.model('blog-post').fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.objectContaining({ resolveRelations: 'true' })
    )
  })

  test('builder sends limit and offset', async () => {
    await entries.model('blog-post').limit(10).offset(20).fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.objectContaining({
        limit: '10',
        offset: '20',
        resolveRelations: 'true',
      })
    )
  })

  test('builder sends eq filter (shorthand)', async () => {
    await entries.model('blog-post').where('category', 'tech').fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.objectContaining({
        'filter[category][eq]': 'tech',
      })
    )
  })

  test('builder sends three-arg filter', async () => {
    await entries.model('blog-post').where('price', 'gte', 100).fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.objectContaining({
        'filter[price][gte]': '100',
      })
    )
  })

  test('builder sends in filter with array', async () => {
    await entries.model('blog-post').where('category', 'in', ['tech', 'science']).fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.objectContaining({
        'filter[category][in]': 'tech,science',
      })
    )
  })

  test('builder sends contains filter', async () => {
    await entries.model('blog-post').where('title', 'contains', 'launch').fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.objectContaining({
        'filter[title][contains]': 'launch',
      })
    )
  })

  test('builder chains multiple where clauses', async () => {
    await entries
      .model('blog-post')
      .where('category', 'tech')
      .where('price', 'gte', 100)
      .where('price', 'lte', 500)
      .fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.objectContaining({
        'filter[category][eq]': 'tech',
        'filter[price][gte]': '100',
        'filter[price][lte]': '500',
      })
    )
  })

  test('expandRelations defaults to true', async () => {
    await entries.model('blog-post').fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.objectContaining({ resolveRelations: 'true' })
    )
  })

  test('expandRelations(false) disables resolution', async () => {
    await entries.model('blog-post').expandRelations(false).fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/blog-post',
      expect.not.objectContaining({ resolveRelations: 'true' })
    )
  })

  test('builder supports generics', async () => {
    interface BlogPost {
      title: string
      body: string
    }

    mockGet.mockResolvedValue([{ id: '1', data: { title: 'Test', body: 'Content' } }])

    const result = await entries.model<BlogPost>('blog-post').fetch()

    // Type check — this compiles if generics work
    expect(result).toBeDefined()
  })

  test('withContext() sends context as query params', async () => {
    await entries
      .model('product')
      .withContext('loyalty_tier', 'vip')
      .withContext('language', 'fr')
      .fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/product',
      expect.objectContaining({
        loyalty_tier: 'vip',
        language: 'fr',
        resolveRelations: 'true',
      })
    )
  })

  test('withContexts() sends all context params at once', async () => {
    await entries
      .model('product')
      .withContexts({ loyalty_tier: 'vip', language: 'fr' })
      .fetch()

    expect(mockGet).toHaveBeenCalledWith(
      '/api/entries/model/product',
      expect.objectContaining({
        loyalty_tier: 'vip',
        language: 'fr',
      })
    )
  })

  test('withContext() is immutable', () => {
    const base = entries.model('product')
    const withContext = base.withContext('language', 'fr')
    expect(base).not.toBe(withContext)
  })

  test('builder is immutable (each call returns new instance)', () => {
    const base = entries.model('blog-post')
    const withLimit = base.limit(10)
    const withOffset = base.offset(20)

    expect(base).not.toBe(withLimit)
    expect(base).not.toBe(withOffset)
    expect(withLimit).not.toBe(withOffset)
  })
})
