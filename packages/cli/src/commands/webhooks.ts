import { Command } from 'commander'
import type { ArchitectManagement, Webhook } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

export async function runWebhooksList(client: ArchitectManagement): Promise<Webhook[]> {
  return client.webhooks.list()
}

export async function runWebhooksAdd(client: ArchitectManagement, url: string, events: string): Promise<Webhook> {
  return client.webhooks.create({
    url,
    events: events.split(',').map(e => e.trim()).filter(Boolean),
    enabled: true,
  })
}

export function registerWebhooks(program: Command): void {
  const wh = program.command('webhooks').description('Manage webhooks')

  wh.command('list')
    .description('List webhooks')
    .action(async () => {
      try {
        printResult(await runWebhooksList(getManagementClient()), program.opts().json ?? false, ['id', 'url', 'events', 'enabled'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  wh.command('add')
    .description('Add a webhook')
    .requiredOption('--url <url>', 'Target URL')
    .requiredOption('--events <list>', 'Comma-separated event names')
    .action(async (opts) => {
      try {
        const w = await runWebhooksAdd(getManagementClient(), opts.url, opts.events)
        console.log(`✓ Added webhook ${w.id}`)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  wh.command('test <id>')
    .description('Send a test delivery')
    .action(async (id: string) => {
      try {
        await getManagementClient().webhooks.test(id)
        console.log(`✓ Test delivery sent for ${id}`)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  wh.command('rm <id>')
    .description('Delete a webhook')
    .action(async (id: string) => {
      try {
        await getManagementClient().webhooks.delete(id)
        console.log(`✓ Removed ${id}`)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
