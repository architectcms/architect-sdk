import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { setupTestContext, teardownTestContext, type TestContext } from './setup'

const apiReachable = await fetch(
  `${process.env.ARCHITECT_TEST_BASE_URL || 'http://localhost:3000'}/health`
).then(() => true).catch(() => false)

describe.skipIf(!apiReachable)('Management SDK Integration', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestContext()
  }, 30000)

  afterAll(async () => {
    if (ctx) await teardownTestContext(ctx)
  }, 15000)

  describe('entry lifecycle', () => {
    let createdEntryId: string

    test('creates an entry', async () => {
      const entry = await ctx.managementClient.entries.create(ctx.testModelName, {
        title: 'SDK Created Entry',
        category: 'sdk-test',
        price: 42,
      })
      expect(entry.id).toBeDefined()
      expect(entry.data.title).toBe('SDK Created Entry')
      createdEntryId = entry.id
    })

    test('updates an entry', async () => {
      const entry = await ctx.managementClient.entries.update(createdEntryId, {
        title: 'SDK Updated Entry',
      })
      expect(entry.data.title).toBe('SDK Updated Entry')
    })

    test('publishes an entry', async () => {
      const entry = await ctx.managementClient.entries.publish(createdEntryId)
      expect(entry).toBeDefined()
    })

    test('unpublishes an entry', async () => {
      const entry = await ctx.managementClient.entries.unpublish(createdEntryId)
      expect(entry).toBeDefined()
    })

    test('deletes an entry', async () => {
      await ctx.managementClient.entries.delete(createdEntryId)
      const entries = await ctx.managementClient.entries.model(ctx.testModelName).fetch()
      const ids = entries.map(e => e.id)
      expect(ids).not.toContain(createdEntryId)
    })
  })

  // Model write operations require the code_root environment.
  // These tests are skipped unless the test env is code_root.
  describe.skip('model lifecycle (requires code_root env)', () => {
    let createdModelId: string

    test('creates a model', async () => {
      const model = await ctx.managementClient.models.create({
        name: `sdk_mgmt_test_${Date.now()}`,
        description: 'Created via SDK',
        fields: [
          { name: 'title', type: 'text', required: true },
        ],
      })
      expect(model.id).toBeDefined()
      createdModelId = model.id
    })

    test('adds a field to model', async () => {
      const model = await ctx.managementClient.models.addField(createdModelId, {
        name: 'body',
        type: 'richtext',
      })
      const bodyField = model.fields.find(f => f.name === 'body')
      expect(bodyField).toBeDefined()
    })

    test('updates a field', async () => {
      const model = await ctx.managementClient.models.updateField(createdModelId, 'body', {
        required: true,
      })
      const bodyField = model.fields.find(f => f.name === 'body')
      expect(bodyField?.required).toBe(true)
    })

    test('deletes a field', async () => {
      await ctx.managementClient.models.deleteField(createdModelId, 'body')
      const model = await ctx.managementClient.models.get(createdModelId)
      expect(model.fields.find(f => f.name === 'body')).toBeUndefined()
    })

    test('deletes a model', async () => {
      await ctx.managementClient.models.delete(createdModelId)
    })
  })

  describe('management client can also read', () => {
    test('lists models (inherited)', async () => {
      const models = await ctx.managementClient.models.list()
      expect(Array.isArray(models)).toBe(true)
    })

    test('lists entries with builder (inherited)', async () => {
      const entries = await ctx.managementClient.entries.model(ctx.testModelName).fetch()
      expect(Array.isArray(entries)).toBe(true)
    })
  })
})
