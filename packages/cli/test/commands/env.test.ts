import { describe, it, expect, vi } from 'vitest'
import { runEnvList, runEnvCreate } from '../../src/commands/env'

function fakeClient() {
  return {
    environments: {
      list: vi.fn().mockResolvedValue([{ id: 'development', role: 'code_root' }]),
      create: vi.fn().mockImplementation(async (d: any) => ({ id: 'staging', ...d })),
    },
  } as any
}

describe('env', () => {
  it('lists environments', async () => {
    const client = fakeClient()
    expect(await runEnvList(client)).toHaveLength(1)
    expect(client.environments.list).toHaveBeenCalledOnce()
  })

  it('creates an environment', async () => {
    const client = fakeClient()
    const created = await runEnvCreate(client, { displayName: 'Staging', promotesTo: 'production' })
    expect(client.environments.create).toHaveBeenCalledWith({ displayName: 'Staging', promotesTo: 'production' })
    expect(created.id).toBe('staging')
  })
})
