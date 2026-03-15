import { describe, test, expect, vi } from 'vitest'
import { ArchitectManagement } from '../src/management'
import { ArchitectDelivery } from '../src/client'
import { ManagementEntriesResource } from '../src/resources/management-entries'
import { ManagementModelsResource } from '../src/resources/management-models'
import { ManagementAssetsResource } from '../src/resources/management-assets'
import { ContextsResource } from '../src/resources/contexts'

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve([]),
}))

describe('ArchitectManagement', () => {
  const validConfig = {
    apiKey: 'arch_mgmt_test',
    organizationId: 'org_123',
    environmentId: 'env_prod',
    baseUrl: 'https://api.example.com',
  }

  test('accepts management key', () => {
    const client = new ArchitectManagement(validConfig)
    expect(client).toBeDefined()
  })

  test('rejects delivery key', () => {
    expect(() => new ArchitectManagement({
      ...validConfig,
      apiKey: 'arch_delivery_test',
    })).toThrow('ArchitectManagement requires a management API key')
  })

  test('rejects preview key', () => {
    expect(() => new ArchitectManagement({
      ...validConfig,
      apiKey: 'arch_preview_test',
    })).toThrow('ArchitectManagement requires a management API key')
  })

  test('requires all config fields', () => {
    expect(() => new ArchitectManagement({
      ...validConfig,
      apiKey: '',
    })).toThrow('apiKey is required')
  })

  test('is an instance of ArchitectDelivery', () => {
    const client = new ArchitectManagement(validConfig)
    expect(client).toBeInstanceOf(ArchitectDelivery)
  })

  test('exposes ManagementEntriesResource', () => {
    const client = new ArchitectManagement(validConfig)
    expect(client.entries).toBeInstanceOf(ManagementEntriesResource)
    expect(typeof client.entries.create).toBe('function')
    expect(typeof client.entries.update).toBe('function')
    expect(typeof client.entries.delete).toBe('function')
    expect(typeof client.entries.publish).toBe('function')
    expect(typeof client.entries.addRelation).toBe('function')
  })

  test('exposes ManagementModelsResource', () => {
    const client = new ArchitectManagement(validConfig)
    expect(client.models).toBeInstanceOf(ManagementModelsResource)
    expect(typeof client.models.create).toBe('function')
    expect(typeof client.models.addField).toBe('function')
  })

  test('exposes ManagementAssetsResource', () => {
    const client = new ArchitectManagement(validConfig)
    expect(client.assets).toBeInstanceOf(ManagementAssetsResource)
    expect(typeof client.assets.upload).toBe('function')
    expect(typeof client.assets.update).toBe('function')
  })

  test('exposes ContextsResource', () => {
    const client = new ArchitectManagement(validConfig)
    expect(client.contexts).toBeDefined()
    expect(client.contexts).toBeInstanceOf(ContextsResource)
    expect(typeof client.contexts.list).toBe('function')
    expect(typeof client.contexts.create).toBe('function')
  })
})
