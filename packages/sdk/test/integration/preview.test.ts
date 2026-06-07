import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { setupTestContext, teardownTestContext, type TestContext } from './setup'

// Skip if API is not reachable
const apiReachable = await fetch(
  `${process.env.ARCHITECT_TEST_BASE_URL || 'http://localhost:3000'}/health`
).then(() => true).catch(() => false)

describe.skipIf(!apiReachable)('Preview vs Delivery Key Behavior', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestContext()
  }, 30000)

  afterAll(async () => {
    if (ctx) await teardownTestContext(ctx)
  }, 15000)

  describe('delivery client (published only)', () => {
    test('only returns published entries', async () => {
      const entries = await ctx.client.entries.model(ctx.testModelName).fetch()
      expect(entries.length).toBe(ctx.publishedEntryIds.length)
      const ids = entries.map(e => e.id)
      for (const pubId of ctx.publishedEntryIds) {
        expect(ids).toContain(pubId)
      }
      for (const draftId of ctx.draftEntryIds) {
        expect(ids).not.toContain(draftId)
      }
    })

    test('does not return draft entries', async () => {
      const entries = await ctx.client.entries.model(ctx.testModelName).fetch()
      const ids = entries.map(e => e.id)
      for (const draftId of ctx.draftEntryIds) {
        expect(ids).not.toContain(draftId)
      }
    })
  })

  describe('preview client (all entries)', () => {
    test('returns all entries including drafts', async () => {
      const entries = await ctx.previewClient.entries.model(ctx.testModelName).fetch()
      expect(entries.length).toBe(ctx.entryIds.length)
      const ids = entries.map(e => e.id)
      for (const id of ctx.entryIds) {
        expect(ids).toContain(id)
      }
    })

    test('returns published entries', async () => {
      const entries = await ctx.previewClient.entries.model(ctx.testModelName).fetch()
      const ids = entries.map(e => e.id)
      for (const pubId of ctx.publishedEntryIds) {
        expect(ids).toContain(pubId)
      }
    })

    test('returns draft entries', async () => {
      const entries = await ctx.previewClient.entries.model(ctx.testModelName).fetch()
      const ids = entries.map(e => e.id)
      for (const draftId of ctx.draftEntryIds) {
        expect(ids).toContain(draftId)
      }
    })
  })

  describe('filtering works with both key types', () => {
    test('delivery client filters work on published entries', async () => {
      const entries = await ctx.client.entries
        .model(ctx.testModelName)
        .where('category', 'tech')
        .fetch()
      expect(entries.every(e => e.data.category === 'tech')).toBe(true)
    })

    test('preview client filters work on all entries', async () => {
      const entries = await ctx.previewClient.entries
        .model(ctx.testModelName)
        .where('category', 'tech')
        .fetch()
      expect(entries.every(e => e.data.category === 'tech')).toBe(true)
      // Preview sees both published and draft tech entries (entries 0 and 2)
      expect(entries.length).toBe(2)
    })
  })
})
