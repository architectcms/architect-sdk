import type { HttpClient } from '../http'

export type LifecycleEvent = 'onCreate' | 'onUpdate' | 'onDelete'
export type LifecycleTiming = 'before' | 'after'

export interface LifecycleFunction {
  id: string
  modelId?: string
  name: string
  description?: string
  /** Events the function runs on. Note: onDelete cannot use 'before' timing. */
  events: LifecycleEvent[]
  /** Map of event → timing; defaults to 'after' server-side when omitted. */
  eventTiming?: Partial<Record<LifecycleEvent, LifecycleTiming>>
  code: string
  enabled?: boolean
  timeout?: number
  createdAt?: string
  updatedAt?: string
}

export type LifecycleFunctionInput = Omit<LifecycleFunction, 'id' | 'modelId' | 'createdAt' | 'updatedAt'>

export class LifecycleResource {
  constructor(private readonly http: HttpClient) {}

  /** List lifecycle functions for a model. GET /api/models/:modelId/lifecycle-functions */
  async list(modelId: string): Promise<LifecycleFunction[]> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: LifecycleFunction[] }>(`/api/models/${modelId}/lifecycle-functions`)
    return response.data
  }

  /** Get a function by id. Functions are fetched by id alone — GET /api/lifecycle-functions/:id */
  async get(id: string): Promise<LifecycleFunction> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: LifecycleFunction }>(`/api/lifecycle-functions/${id}`)
    return response.data
  }

  /** Create a function on a model. POST /api/models/:modelId/lifecycle-functions */
  async create(modelId: string, data: LifecycleFunctionInput): Promise<LifecycleFunction> {
    // API returns { success, data } — unwrap.
    const response = await this.http.post<{ data: LifecycleFunction }>(`/api/models/${modelId}/lifecycle-functions`, data)
    return response.data
  }

  /** Update a function by id. PUT /api/lifecycle-functions/:id (not model-scoped). */
  async update(id: string, data: Partial<LifecycleFunctionInput>): Promise<LifecycleFunction> {
    // API returns { success, data } — unwrap.
    const response = await this.http.put<{ data: LifecycleFunction }>(`/api/lifecycle-functions/${id}`, data)
    return response.data
  }

  /** Delete a function by id. DELETE /api/lifecycle-functions/:id (not model-scoped). */
  async delete(id: string): Promise<void> {
    // API returns { success, message } — nothing to unwrap.
    await this.http.del(`/api/lifecycle-functions/${id}`)
  }
}
