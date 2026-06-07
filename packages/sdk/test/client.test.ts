import { describe, test, expect, vi } from 'vitest'
import { ArchitectDelivery } from '../src/client'
import { ArchitectPreview } from '../src/preview'

// Stub fetch globally for all client tests
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve([]),
}))

describe('ArchitectDelivery', () => {
  test('requires apiKey', () => {
    expect(() => new ArchitectDelivery({
      apiKey: '',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })).toThrow('apiKey is required')
  })

  test('requires organizationId', () => {
    expect(() => new ArchitectDelivery({
      apiKey: 'arch_delivery_test',
      organizationId: '',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })).toThrow('organizationId is required')
  })

  test('requires environmentId', () => {
    expect(() => new ArchitectDelivery({
      apiKey: 'arch_delivery_test',
      organizationId: 'org_123',
      environmentId: '',
      baseUrl: 'https://api.example.com',
    })).toThrow('environmentId is required')
  })

  test('requires baseUrl', () => {
    expect(() => new ArchitectDelivery({
      apiKey: 'arch_delivery_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: '',
    })).toThrow('baseUrl is required')
  })

  test('exposes entries resource', () => {
    const client = new ArchitectDelivery({
      apiKey: 'arch_delivery_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })
    expect(client.entries).toBeDefined()
    expect(typeof client.entries.get).toBe('function')
    expect(typeof client.entries.model).toBe('function')
  })

  test('exposes models resource', () => {
    const client = new ArchitectDelivery({
      apiKey: 'arch_delivery_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })
    expect(client.models).toBeDefined()
    expect(typeof client.models.list).toBe('function')
    expect(typeof client.models.get).toBe('function')
  })

  test('rejects preview key', () => {
    expect(() => new ArchitectDelivery({
      apiKey: 'arch_preview_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })).toThrow('ArchitectDelivery requires a delivery API key')
  })

  test('rejects management key', () => {
    expect(() => new ArchitectDelivery({
      apiKey: 'arch_mgmt_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })).toThrow('ArchitectDelivery requires a delivery API key')
  })

  test('accepts delivery key', () => {
    const client = new ArchitectDelivery({
      apiKey: 'arch_delivery_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })
    expect(client).toBeDefined()
  })

  test('exposes assets resource', () => {
    const client = new ArchitectDelivery({
      apiKey: 'arch_delivery_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })
    expect(client.assets).toBeDefined()
    expect(typeof client.assets.get).toBe('function')
    expect(typeof client.assets.imageUrl).toBe('function')
  })
})

describe('ArchitectPreview', () => {
  test('accepts preview key', () => {
    const client = new ArchitectPreview({
      apiKey: 'arch_preview_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })
    expect(client).toBeDefined()
    expect(client.entries).toBeDefined()
    expect(client.models).toBeDefined()
    expect(client.assets).toBeDefined()
  })

  test('rejects delivery key', () => {
    expect(() => new ArchitectPreview({
      apiKey: 'arch_delivery_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })).toThrow('ArchitectPreview requires a preview API key')
  })

  test('rejects management key', () => {
    expect(() => new ArchitectPreview({
      apiKey: 'arch_mgmt_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })).toThrow('ArchitectPreview requires a preview API key')
  })

  test('requires all config fields', () => {
    expect(() => new ArchitectPreview({
      apiKey: '',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })).toThrow('apiKey is required')
  })

  test('is an instance of ArchitectDelivery', () => {
    const client = new ArchitectPreview({
      apiKey: 'arch_preview_test',
      organizationId: 'org_123',
      environmentId: 'env_prod',
      baseUrl: 'https://api.example.com',
    })
    expect(client).toBeInstanceOf(ArchitectDelivery)
  })
})
