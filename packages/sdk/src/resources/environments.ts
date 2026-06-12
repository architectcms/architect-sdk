import type { HttpClient } from '../http'

export interface Environment {
  id: string
  displayName?: string
  description?: string
  role?: string
  hierarchyOrder?: number
  promotesTo?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export class EnvironmentsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Environment[]> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: Environment[] }>('/api/environments')
    return response.data
  }

  async get(id: string): Promise<Environment> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: Environment }>(`/api/environments/${id}`)
    return response.data
  }

  async create(data: Partial<Environment>): Promise<Environment> {
    // API returns { success, data } — unwrap.
    const response = await this.http.post<{ data: Environment }>('/api/environments', data)
    return response.data
  }

  async update(id: string, data: Partial<Environment>): Promise<Environment> {
    // API returns { success, data } — unwrap.
    const response = await this.http.put<{ data: Environment }>(`/api/environments/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<void> {
    // API returns { success, message } — nothing to unwrap.
    await this.http.del(`/api/environments/${id}`)
  }
}
