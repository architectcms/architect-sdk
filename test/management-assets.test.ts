import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ManagementAssetsResource } from '../src/resources/management-assets'
import { HttpClient } from '../src/http'

describe('ManagementAssetsResource', () => {
  let assets: ManagementAssetsResource
  let mockGet: ReturnType<typeof vi.fn>
  let mockPostFormData: ReturnType<typeof vi.fn>
  let mockPut: ReturnType<typeof vi.fn>
  let mockDel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGet = vi.fn().mockResolvedValue({ id: 'asset_1' })
    mockPostFormData = vi.fn().mockResolvedValue({ id: 'asset_1', filename: 'hero.jpg' })
    mockPut = vi.fn().mockResolvedValue({ id: 'asset_1' })
    mockDel = vi.fn().mockResolvedValue({})
    const httpClient = {
      get: mockGet, postFormData: mockPostFormData,
      put: mockPut, del: mockDel,
    } as unknown as HttpClient
    assets = new ManagementAssetsResource(httpClient, 'https://api.example.com')
  })

  test('get() works (inherited)', async () => {
    await assets.get('asset_1')
    expect(mockGet).toHaveBeenCalledWith('/api/v2/assets/asset_1')
  })

  test('imageUrl() works (inherited)', () => {
    const url = assets.imageUrl('asset_1', { width: 800 })
    expect(url).toContain('width=800')
  })

  test('upload() sends FormData with file and metadata', async () => {
    const buffer = Buffer.from('fake image data')
    await assets.upload(buffer, {
      filename: 'hero.jpg',
      mimeType: 'image/jpeg',
      title: 'Hero Image',
    })

    expect(mockPostFormData).toHaveBeenCalledTimes(1)
    const [path, formData] = mockPostFormData.mock.calls[0]
    expect(path).toBe('/api/v2/assets/upload')
    expect(formData).toBeInstanceOf(FormData)
  })

  test('update() sends PUT with metadata', async () => {
    await assets.update('asset_1', { title: 'New Title', tags: ['hero'] })
    expect(mockPut).toHaveBeenCalledWith('/api/v2/assets/asset_1', {
      title: 'New Title',
      tags: ['hero'],
    })
  })

  test('delete() sends DELETE', async () => {
    await assets.delete('asset_1')
    expect(mockDel).toHaveBeenCalledWith('/api/v2/assets/asset_1')
  })
})
