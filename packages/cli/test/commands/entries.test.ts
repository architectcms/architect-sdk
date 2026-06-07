import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runEntriesPull, runEntriesPush } from '../../src/commands/entries'

function fakeClient(opts: { models?: any[]; entries?: any[] } = {}) {
  const fetch = vi.fn().mockResolvedValue(opts.entries ?? [])
  return {
    models: { list: vi.fn().mockResolvedValue(opts.models ?? [{ id: 'm_article', name: 'Article', fields: [] }]) },
    entries: {
      model: vi.fn().mockReturnValue({ fetch }),
      create: vi.fn().mockImplementation(async (_modelId: string, data: any) => ({ id: 'new', modelId: _modelId, data })),
      update: vi.fn().mockImplementation(async (id: string, data: any) => ({ id, data })),
    },
    _fetch: fetch,
  } as any
}

let dir: string
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'arch-entries-')) })

describe('entries pull', () => {
  it('fetches entries for the resolved model and writes them', async () => {
    const client = fakeClient({ entries: [{ id: 'e1', modelId: 'm_article', data: { title: 'Hi' } }] })
    const out = join(dir, 'entries.json')
    await runEntriesPull(client, { model: 'Article', out })
    expect(client.entries.model).toHaveBeenCalledWith('m_article') // resolved by name -> id
    expect(client._fetch).toHaveBeenCalledOnce()
    const written = JSON.parse(readFileSync(out, 'utf-8'))
    expect(written[0].data.title).toBe('Hi')
  })
})

describe('entries push', () => {
  it('updates entries with an id and creates entries without one', async () => {
    const client = fakeClient()
    const file = join(dir, 'in.json')
    writeFileSync(file, JSON.stringify([
      { id: 'e1', data: { title: 'Edited' } },
      { data: { title: 'Fresh' } },
    ]))
    const summary = await runEntriesPush(client, 'Article', file)
    expect(client.entries.update).toHaveBeenCalledWith('e1', { title: 'Edited' })
    expect(client.entries.create).toHaveBeenCalledWith('m_article', { title: 'Fresh' })
    expect(summary).toEqual([
      { id: 'e1', action: 'update' },
      { id: 'new', action: 'create' },
    ])
  })
})
