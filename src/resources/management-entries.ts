import type { HttpClient } from '../http'
import type { Entry } from '../types/entry'
import { EntriesResource } from './entries'

export class ManagementEntriesResource extends EntriesResource {
  private readonly httpClient: HttpClient

  constructor(http: HttpClient) {
    super(http)
    this.httpClient = http
  }

  async create<T = Record<string, unknown>>(
    modelId: string,
    data: Record<string, unknown>
  ): Promise<Entry<T>> {
    return this.httpClient.post<Entry<T>>('/api/entries', { modelId, data })
  }

  async update<T = Record<string, unknown>>(
    id: string,
    data: Record<string, unknown>
  ): Promise<Entry<T>> {
    return this.httpClient.put<Entry<T>>(`/api/entries/${id}`, { data })
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.del(`/api/entries/${id}`)
  }

  async publish<T = Record<string, unknown>>(id: string): Promise<Entry<T>> {
    return this.httpClient.post<Entry<T>>(`/api/entries/${id}/publish`, {})
  }

  async unpublish<T = Record<string, unknown>>(id: string): Promise<Entry<T>> {
    return this.httpClient.post<Entry<T>>(`/api/entries/${id}/unpublish`, {})
  }

  async addRelation(entryId: string, fieldName: string, targetEntryId: string): Promise<void> {
    await this.httpClient.post(`/api/entries/${entryId}/relationships`, {
      fieldName,
      targetEntryId,
    })
  }

  async removeRelation(entryId: string, fieldName: string, targetEntryId: string): Promise<void> {
    await this.httpClient.del(`/api/entries/${entryId}/relationships/${fieldName}/${targetEntryId}`)
  }
}
