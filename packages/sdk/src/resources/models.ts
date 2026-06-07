import type { HttpClient } from '../http'
import type { Model } from '../types/model'

export class ModelsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Model[]> {
    return this.http.get<Model[]>('/api/models')
  }

  async get(idOrName: string): Promise<Model> {
    return this.http.get<Model>(`/api/models/${idOrName}`)
  }
}
