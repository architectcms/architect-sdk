export interface Field {
  name: string
  displayName?: string
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'relation' | 'model' | 'richtext' | 'group' | 'key' | 'select'
  required?: boolean
  multiple?: boolean
  /** Target model(s) for `model`/`relation` fields. Canonical for `type: 'model'`. */
  targetModelIds?: string[]
  targetModelId?: string
  targetModel?: string
  /** For `model` relations: does this model own its linked entries? */
  exclusive?: boolean
  fields?: Field[]
  layout?: 'inline' | 'stacked'
}

export interface Model {
  id: string
  name: string
  displayName?: string
  fields: Field[]
}
