export class ArchitectError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly requestId?: string

  constructor(message: string, status: number, code: string, requestId?: string) {
    super(message)
    this.name = 'ArchitectError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface ClientConfig {
  apiKey: string
  organizationId: string
  environmentId: string
  baseUrl: string
  timeout?: number
  retries?: number
}
