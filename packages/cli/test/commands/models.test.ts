import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runModelsPull, runModelsPush } from '../../src/commands/models'

function fakeClient(models: any[] = []) {
  return {
    models: {
      list: vi.fn().mockResolvedValue(models),
      create: vi.fn().mockImplementation(async (d: any) => ({ id: 'new_' + d.name, ...d })),
      update: vi.fn().mockImplementation(async (id: string, d: any) => ({ id, ...d })),
    },
  } as any
}

let dir: string
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'arch-models-')) })

describe('models pull', () => {
  it('lists models and writes them to --out', async () => {
    const client = fakeClient([{ id: 'm1', name: 'Article', fields: [] }])
    const out = join(dir, 'models.json')
    await runModelsPull(client, { out })
    expect(client.models.list).toHaveBeenCalledOnce()
    const written = JSON.parse(readFileSync(out, 'utf-8'))
    expect(written[0].name).toBe('Article')
  })
})

describe('models push', () => {
  it('creates absent models and updates existing ones (matched by name)', async () => {
    const client = fakeClient([{ id: 'm1', name: 'Existing', fields: [] }])
    const file = join(dir, 'in.json')
    const { writeFileSync } = await import('node:fs')
    writeFileSync(file, JSON.stringify([
      { name: 'Existing', fields: [{ name: 'title', type: 'string' }] },
      { name: 'Brand New', fields: [] },
    ]))
    const summary = await runModelsPush(client, file)
    expect(client.models.update).toHaveBeenCalledWith('m1', expect.objectContaining({ name: 'Existing' }))
    expect(client.models.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Brand New' }))
    expect(summary).toEqual([
      { name: 'Existing', action: 'update' },
      { name: 'Brand New', action: 'create' },
    ])
  })
})
