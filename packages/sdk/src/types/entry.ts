export interface Entry<T = Record<string, unknown>> {
  id: string
  modelId: string
  data: T
  version: number
  createdAt: string
  updatedAt: string
}

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'
