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

  describe('model lifecycle', () => {
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

  describe('entry relationships', () => {
    let sourceEntryId: string
    let targetEntryId: string
    let relationModelId: string

    beforeAll(async () => {
      // Create a model with a relation field
      const targetModel = await ctx.managementClient.models.create({
        name: `sdk_rel_target_${Date.now()}`,
        fields: [{ name: 'name', type: 'text', required: true }],
      })

      relationModelId = targetModel.id

      // Add relation field to test model
      await ctx.managementClient.models.addField(ctx.testModelId, {
        name: 'related_item',
        type: 'relation',
        targetModelId: relationModelId,
      })

      // Create entries
      const source = await ctx.managementClient.entries.create(ctx.testModelName, {
        title: 'Source Entry',
        category: 'rel-test',
        price: 1,
      })
      sourceEntryId = source.id

      const target = await ctx.managementClient.entries.create(targetModel.name, {
        name: 'Target Entry',
      })
      targetEntryId = target.id
    }, 15000)

    afterAll(async () => {
      // Cleanup
      try { await ctx.managementClient.entries.delete(sourceEntryId) } catch {}
      try { await ctx.managementClient.entries.delete(targetEntryId) } catch {}
      try { await ctx.managementClient.models.deleteField(ctx.testModelId, 'related_item') } catch {}
      try { await ctx.managementClient.models.delete(relationModelId) } catch {}
    })

    test('adds a relation', async () => {
      await ctx.managementClient.entries.addRelation(sourceEntryId, 'related_item', targetEntryId)
      const entry = await ctx.managementClient.entries.get(sourceEntryId)
      expect(entry.data.related_item).toBeDefined()
    })

    test('removes a relation', async () => {
      await ctx.managementClient.entries.removeRelation(sourceEntryId, 'related_item', targetEntryId)
      const entry = await ctx.managementClient.entries.get(sourceEntryId)
      // After removal, field should be null/undefined or not contain the target
      const value = entry.data.related_item
      expect(value === null || value === undefined || value === '').toBe(true)
    })
  })

  describe('asset lifecycle', () => {
    let uploadedAssetId: string

    test('uploads an asset', async () => {
      const buffer = Buffer.from('fake image data for testing')
      const asset = await ctx.managementClient.assets.upload(buffer, {
        filename: 'test-image.txt',
        mimeType: 'text/plain',
        title: 'SDK Test Asset',
      })
      expect(asset.id).toBeDefined()
      expect(asset.title).toBe('SDK Test Asset')
      uploadedAssetId = asset.id
    })

    test('updates asset metadata', async () => {
      const asset = await ctx.managementClient.assets.update(uploadedAssetId, {
        title: 'Updated SDK Asset',
        tags: ['test', 'sdk'],
      })
      expect(asset.title).toBe('Updated SDK Asset')
    })

    test('gets asset', async () => {
      const asset = await ctx.managementClient.assets.get(uploadedAssetId)
      expect(asset.id).toBe(uploadedAssetId)
      expect(asset.title).toBe('Updated SDK Asset')
    })

    test('deletes an asset', async () => {
      await ctx.managementClient.assets.delete(uploadedAssetId)
      // Verify it's gone
      await expect(ctx.managementClient.assets.get(uploadedAssetId)).rejects.toThrow()
    })
  })

  describe('context provider lifecycle', () => {
    let contextId: string

    test('creates a context provider', async () => {
      const provider = await ctx.managementClient.contexts.create({
        name: `SDK Test Context ${Date.now()}`,
        sourceModelId: ctx.testModelName,
        keyField: 'category',
        derivationPath: ['category'],
      })
      expect(provider.id).toBeDefined()
      contextId = provider.id
    })

    test('lists context providers', async () => {
      const providers = await ctx.managementClient.contexts.list()
      expect(Array.isArray(providers)).toBe(true)
      expect(providers.length).toBeGreaterThan(0)
    })

    test('deletes a context provider', async () => {
      expect(contextId).toBeDefined()
      await ctx.managementClient.contexts.delete(contextId)
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
