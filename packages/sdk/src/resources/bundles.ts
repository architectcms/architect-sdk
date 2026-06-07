import type { HttpClient } from '../http'

export interface Bundle {
  id: string
  name: string
  version: string
  description?: string
  visibility?: 'private' | 'public'
}

export class BundlesResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Bundle[]> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: Bundle[] }>('/api/bundles')
    return response.data
  }

  /**
   * Install a bundle into the client's organization/environment.
   *
   * The target org/env are resolved server-side from the request headers
   * (X-Organization / X-Environment), which the HttpClient sends from the
   * client config — so the request body carries install options only.
   */
  async install(bundleId: string, options: Record<string, unknown> = {}): Promise<unknown> {
    // API returns { success, data } — unwrap.
    const response = await this.http.post<{ data: unknown }>(`/api/bundles/${bundleId}/install`, options)
    return response.data
  }
}
