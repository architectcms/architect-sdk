import type { HttpClient } from '../http'

export interface ContextAction {
  id: string
  name: string
  contextProviderId?: string
  description?: string
  code?: string
  enabled?: boolean
  timeout?: number
  [key: string]: unknown
}

export interface ContextActionExecuteParams {
  /** Entry to run the action against (required by the API). */
  entryId: string
  /** Context value to execute under, e.g. a locale or segment id (required by the API). */
  contextValue: string
  modelId?: string
}

export interface ContextActionExecuteResult {
  modifiedEntry?: unknown
  executionTime?: number
  [key: string]: unknown
}

export class ContextActionsResource {
  constructor(private readonly http: HttpClient) {}

  /** List actions for a context provider. GET /api/context-providers/:providerId/context-actions */
  async list(providerId: string): Promise<ContextAction[]> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: ContextAction[] }>(`/api/context-providers/${providerId}/context-actions`)
    return response.data
  }

  /** Get an action by id. GET /api/context-actions/:id */
  async get(id: string): Promise<ContextAction> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: ContextAction }>(`/api/context-actions/${id}`)
    return response.data
  }

  /** Create an action under a context provider. POST /api/context-providers/:providerId/context-actions */
  async create(providerId: string, data: Record<string, unknown>): Promise<ContextAction> {
    // API returns { success, data } — unwrap.
    const response = await this.http.post<{ data: ContextAction }>(`/api/context-providers/${providerId}/context-actions`, data)
    return response.data
  }

  /** Update an action by id. PUT /api/context-actions/:id */
  async update(id: string, data: Record<string, unknown>): Promise<ContextAction> {
    // API returns { success, data } — unwrap.
    const response = await this.http.put<{ data: ContextAction }>(`/api/context-actions/${id}`, data)
    return response.data
  }

  /** Delete an action by id. DELETE /api/context-actions/:id */
  async delete(id: string): Promise<void> {
    // API returns { success, message } — nothing to unwrap.
    await this.http.del(`/api/context-actions/${id}`)
  }

  /** Execute an action on an entry. POST /api/context-actions/:id/execute */
  async execute(id: string, params: ContextActionExecuteParams): Promise<ContextActionExecuteResult> {
    // API returns { success, data: { modifiedEntry, executionTime } } — unwrap.
    const response = await this.http.post<{ data: ContextActionExecuteResult }>(`/api/context-actions/${id}/execute`, params)
    return response.data
  }
}
