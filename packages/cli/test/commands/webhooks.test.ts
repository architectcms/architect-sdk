import { describe, it, expect, vi } from 'vitest'
import { runWebhooksList, runWebhooksAdd } from '../../src/commands/webhooks'

function fakeClient() {
  return {
    webhooks: {
      list: vi.fn().mockResolvedValue([{ id: 'wh1', url: 'https://x', events: ['entry.published'] }]),
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

  it('adds a webhook (parses comma-separated events)', async () => {
    const client = fakeClient()
    await runWebhooksAdd(client, 'https://x', 'entry.published, entry.deleted')
    expect(client.webhooks.create).toHaveBeenCalledWith({ url: 'https://x', events: ['entry.published', 'entry.deleted'], enabled: true })
  })
})
