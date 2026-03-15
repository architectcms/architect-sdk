export interface Field {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'relation' | 'richtext' | 'group'
  required?: boolean
  multiple?: boolean
  targetModelId?: string
  targetModel?: string
  fields?: Field[]
  layout?: 'inline' | 'stacked'
}

export interface Model {
  id: string
  name: string
  displayName?: string
  fields: Field[]
}
