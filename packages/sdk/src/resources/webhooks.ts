import type { HttpClient } from '../http'

/**
 * A webhook trigger: an object type + action pair, e.g.
 * `{ type: 'entry', action: 'published' }`.
 */
export interface WebhookTrigger {
  type: string
  action: string
  /** Optional target restriction; specific targets also need targetId. */
  target?: string
  targetId?: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  triggers: WebhookTrigger[]
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
}

export type WebhookInput = {
  name: string
  url: string
  triggers: WebhookTrigger[]
  enabled?: boolean
} & Record<string, unknown>

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Webhook[]> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: Webhook[] }>('/api/webhooks')
    return response.data
  }

  async get(id: string): Promise<Webhook> {
    // API returns { success, data } — unwrap.
    const response = await this.http.get<{ data: Webhook }>(`/api/webhooks/${id}`)
    return response.data
  }

  async create(data: WebhookInput): Promise<Webhook> {
    // API returns { success, data } — unwrap.
    const response = await this.http.post<{ data: Webhook }>('/api/webhooks', data)
    return response.data
  }

  async update(id: string, data: Partial<WebhookInput>): Promise<Webhook> {
    // API returns { success, data } — unwrap.
    const response = await this.http.put<{ data: Webhook }>(`/api/webhooks/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<void> {
    // API returns { success, message } — nothing to unwrap.
    await this.http.del(`/api/webhooks/${id}`)
  }

  /** Send a test delivery. POST /api/webhooks/:id/test */
  async test(id: string): Promise<unknown> {
    // API returns { success, data } — unwrap.
    const response = await this.http.post<{ data: unknown }>(`/api/webhooks/${id}/test`, {})
    return response.data
  }
}
