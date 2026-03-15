export interface ContextProvider {
  id: string
  name: string
  sourceModelId: string
  keyField?: string
  resolution?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}
