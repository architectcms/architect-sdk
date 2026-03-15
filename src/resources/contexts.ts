import type { HttpClient } from '../http'
import type { ContextProvider } from '../types/context'

export class ContextsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ContextProvider[]> {
    return this.http.get<ContextProvider[]>('/api/context-providers')
  }

  async get(id: string): Promise<ContextProvider> {
    return this.http.get<ContextProvider>(`/api/context-providers/${id}`)
  }

  async create(data: { name: string; sourceModelId: string; [key: string]: unknown }): Promise<ContextProvider> {
    return this.http.post<ContextProvider>('/api/context-providers', data)
  }

  async update(id: string, data: Partial<ContextProvider>): Promise<ContextProvider> {
    return this.http.put<ContextProvider>(`/api/context-providers/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    await this.http.del(`/api/context-providers/${id}`)
  }
}
