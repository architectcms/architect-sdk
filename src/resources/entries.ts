import type { HttpClient } from '../http'
import type { Entry, FilterOperator } from '../types/entry'

interface Filter {
  field: string
  operator: FilterOperator
  value: unknown
}

interface QueryState {
  modelId: string
  filters: Filter[]
  limitValue?: number
  offsetValue?: number
  expand: boolean
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

    return this.http.get<Entry<T>[]>(
      `/api/entries/model/${this.state.modelId}`,
      params
    )
  }
}

export class EntriesResource {
  constructor(private readonly http: HttpClient) {}

  async get<T = Record<string, unknown>>(id: string): Promise<Entry<T>> {
    return this.http.get<Entry<T>>(`/api/entries/${id}`)
  }

  model<T = Record<string, unknown>>(modelId: string): EntryQuery<T> {
    return new EntryQuery<T>(this.http, {
      modelId,
      filters: [],
      expand: true,
    })
  }
}
