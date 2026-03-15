import { describe, test, expect, vi, beforeEach } from 'vitest'
import { AssetsResource } from '../src/resources/assets'
import { HttpClient } from '../src/http'

vi.mock('../src/http')

describe('AssetsResource', () => {
  let assets: AssetsResource
  let mockGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGet = vi.fn()
    const httpClient = {
      get: mockGet,
    } as unknown as HttpClient
    assets = new AssetsResource(httpClient, 'https://api.example.com')
  })

  test('get() calls correct endpoint', async () => {
    mockGet.mockResolvedValue({ id: 'asset_1', title: 'Hero Image', filename: 'hero.jpg' })

    const result = await assets.get('asset_1')

    expect(mockGet).toHaveBeenCalledWith('/api/v2/assets/asset_1')
    expect(result.title).toBe('Hero Image')
  })

  test('imageUrl() builds URL with transforms', () => {
    const url = assets.imageUrl('asset_1', {
      width: 800,
      height: 600,
      format: 'webp',
      quality: 80,
    })

    expect(url).toContain('https://api.example.com/api/v2/assets/asset_1/transform')
    expect(url).toContain('width=800')
    expect(url).toContain('height=600')
    expect(url).toContain('format=webp')
    expect(url).toContain('quality=80')
  })

  test('imageUrl() with only width', () => {
    const url = assets.imageUrl('asset_1', { width: 400 })

    expect(url).toContain('width=400')
    expect(url).not.toContain('height')
    expect(url).not.toContain('format')
  })

  test('imageUrl() with no transforms returns file URL', () => {
    const url = assets.imageUrl('asset_1')

    expect(url).toBe('https://api.example.com/api/v2/assets/asset_1/file')
  })
})
