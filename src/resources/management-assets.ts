import type { HttpClient } from '../http'
import type { Asset } from '../types/asset'
import { AssetsResource } from './assets'

interface UploadOptions {
  filename: string
  mimeType: string
  title?: string
  description?: string
  tags?: string[]
}

export class ManagementAssetsResource extends AssetsResource {
  private readonly httpClient: HttpClient

  constructor(http: HttpClient, baseUrl: string) {
    super(http, baseUrl)
    this.httpClient = http
  }

  async upload(file: Uint8Array | ReadableStream, options: UploadOptions): Promise<Asset> {
    const formData = new FormData()

    const blobPart: BlobPart = file instanceof Uint8Array
      ? file as unknown as BlobPart
      : file as unknown as BlobPart
    const blob = new Blob([blobPart], { type: options.mimeType })

    formData.append('file', blob, options.filename)
    if (options.title) formData.append('title', options.title)
    if (options.description) formData.append('description', options.description)
    if (options.tags) formData.append('tags', JSON.stringify(options.tags))

    // API returns { message, asset } — unwrap
    const response = await this.httpClient.postFormData<{ asset: Asset }>('/api/v2/assets/upload', formData)
    return response.asset
  }

  async update(
    id: string,
    metadata: { title?: string; description?: string; tags?: string[]; alt?: string; category?: string }
  ): Promise<Asset> {
    // API returns { message, asset } — unwrap
    const response = await this.httpClient.put<{ asset: Asset }>(`/api/v2/assets/${id}`, metadata)
    return response.asset
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.del(`/api/v2/assets/${id}`)
  }
}
