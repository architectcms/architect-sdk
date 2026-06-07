import type { HttpClient } from '../http'
import type { Model, Field } from '../types/model'
import { ModelsResource } from './models'

export class ManagementModelsResource extends ModelsResource {
  private readonly httpClient: HttpClient

  constructor(http: HttpClient) {
    super(http)
    this.httpClient = http
  }

  async create(data: {
    name: string
    displayName?: string
    description?: string
    fields?: Partial<Field>[]
    /** Field name used as the lookup key (must exist in `fields`). */
    keyField?: string
    /** Mark this model as a context source model (for context providers). */
    isContextModel?: boolean
    type?: 'single' | 'multiple'
    category?: 'reference_data' | 'content' | 'configuration' | 'transactional'
  }): Promise<Model> {
    return this.httpClient.post<Model>('/api/models', data)
  }

  async update(id: string, data: Partial<Model>): Promise<Model> {
    return this.httpClient.put<Model>(`/api/models/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.del(`/api/models/${id}`)
  }

  async addField(modelId: string, field: Partial<Field>): Promise<Model> {
    return this.httpClient.post<Model>(`/api/models/${modelId}/fields`, field)
  }

  async updateField(modelId: string, fieldName: string, updates: Partial<Field>): Promise<Model> {
    return this.httpClient.put<Model>(`/api/models/${modelId}/fields/${fieldName}`, updates)
  }

  async deleteField(modelId: string, fieldName: string): Promise<void> {
    await this.httpClient.del(`/api/models/${modelId}/fields/${fieldName}`)
  }
}
