import { Command } from 'commander'
import type { ArchitectManagement, Webhook, WebhookTrigger } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

// The API expects triggers as { type, action } pairs; the CLI accepts the
// friendlier dot syntax (entry.published, model.updated) and maps it.
function parseTriggers(events: string): WebhookTrigger[] {
  return events.split(',').map(e => e.trim()).filter(Boolean).map((e) => {
    const i = e.indexOf('.')
    if (i <= 0 || i === e.length - 1) {
      throw new Error(`Invalid event '${e}'. Use object.action format, e.g. entry.published`)
    }
    return { type: e.slice(0, i), action: e.slice(i + 1) }
  })
}

export async function runWebhooksList(client: ArchitectManagement): Promise<Webhook[]> {
  return client.webhooks.list()
}

export async function runWebhooksAdd(client: ArchitectManagement, name: string, url: string, events: string): Promise<Webhook> {
  return client.webhooks.create({
    name,
    url,
    triggers: parseTriggers(events),
    enabled: true,
  })
}

export function registerWebhooks(program: Command): void {
  const wh = program.command('webhooks').description('Manage webhooks')

  wh.command('list')
    .description('List webhooks')
    .action(async () => {
      try {
        printResult(await runWebhooksList(getManagementClient()), program.opts().json ?? false, ['id', 'name', 'url', 'enabled'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  wh.command('add')
    .description('Add a webhook')
    .requiredOption('--name <name>', 'Webhook name')
    .requiredOption('--url <url>', 'Target URL')
    .requiredOption('--events <list>', 'Comma-separated events in object.action form (e.g. entry.published,model.updated)')
    .action(async (opts) => {
      try {
        const w = await runWebhooksAdd(getManagementClient(), opts.name, opts.url, opts.events)
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
