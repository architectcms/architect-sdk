import { describe, it, expect, vi } from 'vitest'
import { runWebhooksList, runWebhooksAdd } from '../../src/commands/webhooks'

function fakeClient() {
  return {
    webhooks: {
      list: vi.fn().mockResolvedValue([{ id: 'wh1', url: 'https://x', triggers: [{ type: 'entry', action: 'published' }] }]),
      create: vi.fn().mockImplementation(async (d: any) => ({ id: 'wh2', ...d })),
      test: vi.fn().mockResolvedValue({ delivered: true }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  } as any
}

describe('webhooks', () => {
  it('lists webhooks', async () => {
    const client = fakeClient()
    expect(await runWebhooksList(client)).toHaveLength(1)
    expect(client.webhooks.list).toHaveBeenCalledOnce()
  })

  it('adds a webhook (maps object.action events to triggers, sends required name)', async () => {
    const client = fakeClient()
    await runWebhooksAdd(client, 'Notify deploys', 'https://x', 'entry.published, entry.deleted')
    expect(client.webhooks.create).toHaveBeenCalledWith({
      name: 'Notify deploys',
      url: 'https://x',
      triggers: [
        { type: 'entry', action: 'published' },
        { type: 'entry', action: 'deleted' },
      ],
      enabled: true,
    })
  })

  it('rejects events without object.action format', async () => {
    const client = fakeClient()
    await expect(runWebhooksAdd(client, 'X', 'https://x', 'published')).rejects.toThrow(/object\.action/)
    expect(client.webhooks.create).not.toHaveBeenCalled()
  })
})
