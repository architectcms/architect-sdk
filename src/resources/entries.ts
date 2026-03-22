import type { HttpClient } from '../http'
import type { Entry, FilterOperator } from '../types/entry'

interface Filter {
  field: string
  operator: FilterOperator
  value: unknown
}

/**
 * Context query for content resolution.
 * Keys are context provider identifiers, values are the context values.
 * Example: { loyalty_tier: 'vip', language: 'fr' }
 */
export type ContextQuery = Record<string, string>

interface QueryState {
  modelId: string
  filters: Filter[]
  limitValue?: number
  offsetValue?: number
  expand: boolean
  context: ContextQuery
}

export class EntryQuery<T = Record<string, unknown>> {
  private readonly state: QueryState

  constructor(
    private readonly http: HttpClient,
    state: QueryState
  ) {
    this.state = { ...state }
  }

  where(field: string, value: unknown): EntryQuery<T>
  where(field: string, operator: FilterOperator, value: unknown): EntryQuery<T>
  where(field: string, operatorOrValue: unknown, ...rest: unknown[]): EntryQuery<T> {
    const isShorthand = rest.length === 0
    const filter: Filter = isShorthand
      ? { field, operator: 'eq', value: operatorOrValue }
      : { field, operator: operatorOrValue as FilterOperator, value: rest[0] }

    return new EntryQuery<T>(this.http, {
      ...this.state,
      filters: [...this.state.filters, filter],
    })
  }

  /**
   * Set a single context value for content resolution.
   * Context providers resolve field overrides based on these values.
   *
   * @example
   * client.entries.model('product')
   *   .withContext('loyalty_tier', 'vip')
   *   .withContext('language', 'fr')
   *   .fetch()
   */
  withContext(key: string, value: string): EntryQuery<T> {
    return new EntryQuery<T>(this.http, {
      ...this.state,
      context: { ...this.state.context, [key]: value },
    })
  }

  /**
   * Set multiple context values at once for content resolution.
   *
   * @example
   * client.entries.model('product')
   *   .withContexts({ loyalty_tier: 'vip', language: 'fr' })
   *   .fetch()
   */
  withContexts(context: ContextQuery): EntryQuery<T> {
    return new EntryQuery<T>(this.http, {
      ...this.state,
      context: { ...this.state.context, ...context },
    })
  }

  limit(n: number): EntryQuery<T> {
    return new EntryQuery<T>(this.http, { ...this.state, limitValue: n })
  }

  offset(n: number): EntryQuery<T> {
    return new EntryQuery<T>(this.http, { ...this.state, offsetValue: n })
  }

  expandRelations(expand: boolean): EntryQuery<T> {
    return new EntryQuery<T>(this.http, { ...this.state, expand })
  }

  async fetch(): Promise<Entry<T>[]> {
    const params: Record<string, string> = {}

    if (this.state.expand) {
      params.resolveRelations = 'true'
    }

    if (this.state.limitValue !== undefined) {
      params.limit = String(this.state.limitValue)
    }

    if (this.state.offsetValue !== undefined) {
      params.offset = String(this.state.offsetValue)
    }

    for (const filter of this.state.filters) {
      const key = `filter[${filter.field}][${filter.operator}]`
      params[key] = Array.isArray(filter.value)
        ? filter.value.join(',')
        : String(filter.value)
    }

    // Context query params are passed as top-level query params
    // The API treats any unrecognized query params as context resolution keys
    for (const [key, value] of Object.entries(this.state.context)) {
      params[key] = value
    }

    return this.http.get<Entry<T>[]>(
      `/api/entries/model/${this.state.modelId}`,
      params
    )
  }
}

export class EntriesResource {
  constructor(protected readonly http: HttpClient) {}

  /**
   * Get a single entry by ID, optionally with context resolution.
   *
   * @example
   * // Without context
   * const entry = await client.entries.get('entry_123')
   *
   * // With context — returns field values resolved for the given context
   * const entry = await client.entries.get('entry_123', { loyalty_tier: 'vip', language: 'fr' })
   */
  async get<T = Record<string, unknown>>(id: string, context?: ContextQuery): Promise<Entry<T>> {
    const params: Record<string, string> | undefined =
      context && Object.keys(context).length > 0 ? context : undefined
    return this.http.get<Entry<T>>(`/api/entries/${id}`, params)
  }

  model<T = Record<string, unknown>>(modelId: string): EntryQuery<T> {
    return new EntryQuery<T>(this.http, {
      modelId,
      filters: [],
      expand: true,
      context: {},
    })
  }
}
