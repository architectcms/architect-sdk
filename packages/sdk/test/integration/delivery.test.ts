import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { setupTestContext, teardownTestContext, type TestContext } from './setup'
import { ArchitectError } from '../../src/types/common'

// Skip if API is not reachable
const apiReachable = await fetch(
  `${process.env.ARCHITECT_TEST_BASE_URL || 'http://localhost:3000'}/health`
).then(() => true).catch(() => false)

describe.skipIf(!apiReachable)('Delivery SDK Integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestContext()
  }, 30000)

  afterAll(async () => {
    if (ctx) await teardownTestContext(ctx)
  }, 15000)

  describe('models', () => {
    test('lists models', async () => {
      const models = await ctx.client.models.list()
      expect(Array.isArray(models)).toBe(true)
      expect(models.length).toBeGreaterThan(0)
    })

    test('gets model by name', async () => {
      const model = await ctx.client.models.get(ctx.testModelName)
      expect(model.id).toBe(ctx.testModelId)
      expect(model.fields).toBeDefined()
      expect(model.fields.length).toBeGreaterThan(0)
    })

    test('gets model by ID', async () => {
      const model = await ctx.client.models.get(ctx.testModelId)
      expect(model.name).toBe(ctx.testModelName)
    })
  })

  describe('entries', () => {
    test('lists entries by model name (published only)', async () => {
      const entries = await ctx.client.entries.model(ctx.testModelName).fetch()
      expect(Array.isArray(entries)).toBe(true)
      expect(entries.length).toBe(ctx.publishedEntryIds.length)
    })

    test('gets single entry by ID', async () => {
      const entry = await ctx.client.entries.get(ctx.publishedEntryIds[0])
      expect(entry.id).toBe(ctx.publishedEntryIds[0])
      expect(entry.data.title).toBe('Alpha Launch')
    })

    test('paginates with limit', async () => {
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .limit(1)
        .fetch()
      expect(entries.length).toBe(1)
    })

    test('paginates with limit and offset', async () => {
      const page1 = await ctx.client.entries.model(ctx.testModelName).limit(1).fetch()
      const page2 = await ctx.client.entries.model(ctx.testModelName).limit(1).offset(1).fetch()
      expect(page1.length).toBe(1)
      expect(page2.length).toBe(1)
      // No overlap
      const page1Ids = page1.map(e => e.id)
      const page2Ids = page2.map(e => e.id)
      expect(page1Ids.some(id => page2Ids.includes(id))).toBe(false)
    })

    test('filters by string eq', async () => {
      // Only entry 0 (Alpha Launch, tech) is published; entry 2 (Gamma Update, tech) is a draft
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .where('category', 'tech')
        .fetch()
      expect(entries.length).toBe(1)
      expect(entries.every(e => e.data.category === 'tech')).toBe(true)
    })

    test('filters by numeric gte', async () => {
      // Only entry 1 (Beta Release, price 200) is published; entry 2 (price 300) is a draft
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .where('price', 'gte', 200)
        .fetch()
      expect(entries.length).toBe(1)
      expect(entries.every(e => (e.data.price as number) >= 200)).toBe(true)
    })

    test('filters by in operator', async () => {
      // Published: entry 0 (tech) and entry 1 (science) — both match
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .where('category', 'in', ['tech', 'science'])
        .fetch()
      expect(entries.length).toBe(2)
      expect(entries.every(e => ['tech', 'science'].includes(e.data.category as string))).toBe(true)
    })

    test('filters by contains (case-insensitive)', async () => {
      // Only entry 0 (Alpha Launch) is published; entry 3 (Delta Launch) is a draft
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .where('title', 'contains', 'launch')
        .fetch()
      expect(entries.length).toBe(1)
      expect(entries.every(e => (e.data.title as string).toLowerCase().includes('launch'))).toBe(true)
    })

    test('combines multiple filters (AND)', async () => {
      // category=tech AND price>=200 matches only entry 2 (Gamma Update), which is a draft
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .where('category', 'tech')
        .where('price', 'gte', 200)
        .fetch()
      expect(entries.length).toBe(0)
    })

    test('filters with pagination combined', async () => {
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .where('category', 'tech')
        .limit(1)
        .fetch()
      expect(entries.length).toBe(1)
      expect(entries[0].data.category).toBe('tech')
    })

    test('expandRelations(false) works', async () => {
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .expandRelations(false)
        .fetch()
      expect(Array.isArray(entries)).toBe(true)
      expect(entries.length).toBe(ctx.publishedEntryIds.length)
    })
  })

  describe('assets', () => {
    test('imageUrl builds correct URL', () => {
      const url = ctx.client.assets.imageUrl('asset_123', { width: 800, format: 'webp' })
      expect(url).toContain('/api/v2/assets/asset_123/transform')
      expect(url).toContain('width=800')
      expect(url).toContain('format=webp')
    })
  })

  describe('error handling', () => {
    test('throws ArchitectError on nonexistent entry', async () => {
      try {
        await ctx.client.entries.get('nonexistent_entry_id')
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ArchitectError)
        expect((e as ArchitectError).status).toBeGreaterThanOrEqual(400)
      }
    })

    test('returns empty array for nonexistent model', async () => {
      const entries = await ctx.client.entries.model('nonexistent_model_xyz').fetch()
      expect(entries).toEqual([])
    })
  })
})
