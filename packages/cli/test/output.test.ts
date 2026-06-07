import { describe, it, expect } from 'vitest'
import { formatTable } from '../src/output'

describe('formatTable', () => {
  it('renders rows with headers', () => {
    const out = formatTable([{ id: 'a', name: 'Alpha' }], ['id', 'name'])
    expect(out).toContain('id')
    expect(out).toContain('Alpha')
  })
})
