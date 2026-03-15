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
    return this.request<T>(url)
  }

  private async request<T>(url: string, attempt = 0): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const error = new ArchitectError(
          body.error || `Request failed with status ${response.status}`,
          response.status,
          body.code || 'UNKNOWN_ERROR',
          body.requestId
        )

        // Only retry on 5xx
        if (response.status >= 500 && attempt < this.retries) {
          await this.delay(RETRY_BASE_DELAY * Math.pow(2, attempt))
          return this.request<T>(url, attempt + 1)
        }

        throw error
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
        return this.request<T>(url, attempt + 1)
      }

      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
