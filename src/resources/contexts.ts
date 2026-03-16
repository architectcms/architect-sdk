import type { HttpClient } from '../http'
import type { ContextProvider } from '../types/context'

export class ContextsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ContextProvider[]> {
    // API returns { success, providers } — unwrap
    const response = await this.http.get<{ providers: ContextProvider[] }>('/api/context-providers')
    return response.providers
  }

  async get(id: string): Promise<ContextProvider> {
    // API returns { success, provider } — unwrap
    const response = await this.http.get<{ provider: ContextProvider }>(`/api/context-providers/${id}`)
    return response.provider
  }

  async create(data: { name: string; sourceModelId: string; [key: string]: unknown }): Promise<ContextProvider> {
    // API expects 'sourceModel' not 'sourceModelId'; returns { success, provider }
    const { sourceModelId, ...rest } = data
    const response = await this.http.post<{ provider: ContextProvider }>('/api/context-providers', {
      ...rest,
      sourceModel: sourceModelId,
    })
    return response.provider
  }

  async update(id: string, data: Partial<ContextProvider>): Promise<ContextProvider> {
    // API returns { success, provider } — unwrap
    const response = await this.http.put<{ provider: ContextProvider }>(`/api/context-providers/${id}`, data)
    return response.provider
  }

  async delete(id: string): Promise<void> {
    await this.http.del(`/api/context-providers/${id}`)
  }
}
