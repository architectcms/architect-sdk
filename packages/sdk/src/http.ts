import { ArchitectError, type ClientConfig } from './types/common'

const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 2
const RETRY_BASE_DELAY = 200

export class HttpClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>
  private readonly timeout: number
  private readonly retries: number

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT
    this.retries = config.retries ?? DEFAULT_RETRIES
    this.headers = {
      'X-API-Key': config.apiKey,
      'X-Organization': config.organizationId,
      'X-Environment': config.environmentId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }
    return this.request<T>(url, 'GET')
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    return this.request<T>(url, 'POST', JSON.stringify(body))
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    return this.request<T>(url, 'PUT', JSON.stringify(body))
  }

  async del<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`
    return this.request<T>(url, 'DELETE')
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const { 'Content-Type': _, ...headersWithoutContentType } = this.headers
    return this.request<T>(url, 'POST', formData, headersWithoutContentType)
  }

  private async request<T>(
    url: string,
    method: string,
    body?: string | FormData,
    headersOverride?: Record<string, string>,
    attempt = 0
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: headersOverride || this.headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}))
        const error = new ArchitectError(
          responseBody.error || `Request failed with status ${response.status}`,
          response.status,
          responseBody.code || 'UNKNOWN_ERROR',
          responseBody.requestId
        )

        // Only retry on 5xx
        if (response.status >= 500 && attempt < this.retries) {
          await this.delay(RETRY_BASE_DELAY * Math.pow(2, attempt))
          return this.request<T>(url, method, body, headersOverride, attempt + 1)
        }

        throw error
      }

      if (response.status === 204) {
        return {} as T
      }

      return response.json() as Promise<T>
    } catch (error) {
      clearTimeout(timeoutId)

      // Don't retry on timeout aborts or ArchitectErrors
      if (error instanceof ArchitectError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ArchitectError('Request timed out', 0, 'TIMEOUT')
      }

      // Retry on network errors
      if (attempt < this.retries) {
        await this.delay(RETRY_BASE_DELAY * Math.pow(2, attempt))
        return this.request<T>(url, method, body, headersOverride, attempt + 1)
      }

      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
