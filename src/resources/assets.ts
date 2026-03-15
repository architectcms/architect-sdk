import type { HttpClient } from '../http'
import type { Asset, ImageTransformOptions } from '../types/asset'

export class AssetsResource {
  constructor(
    private readonly http: HttpClient,
    private readonly baseUrl: string
  ) {}

  async get(id: string): Promise<Asset> {
    return this.http.get<Asset>(`/api/v2/assets/${id}`)
  }

  imageUrl(id: string, transforms?: ImageTransformOptions): string {
    const base = `${this.baseUrl}/api/v2/assets/${id}`

    if (!transforms || Object.keys(transforms).length === 0) {
      return `${base}/file`
    }

    const params = new URLSearchParams()
    if (transforms.width) params.set('width', String(transforms.width))
    if (transforms.height) params.set('height', String(transforms.height))
    if (transforms.format) params.set('format', transforms.format)
    if (transforms.quality) params.set('quality', String(transforms.quality))

    return `${base}/transform?${params.toString()}`
  }
}
