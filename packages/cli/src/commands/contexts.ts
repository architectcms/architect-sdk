import { Command } from 'commander'
import { writeFileSync, readFileSync } from 'node:fs'
import type { ArchitectManagement } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

type ProviderInput = { id?: string; name: string; sourceModelId: string } & Record<string, unknown>

export async function runContextsList(client: ArchitectManagement) {
  return client.contexts.list()
}

export async function runContextsGet(client: ArchitectManagement, id: string) {
  return client.contexts.get(id)
}

export async function runContextsPush(
  client: ArchitectManagement,
  providers: ProviderInput[],
): Promise<Array<{ id: string; action: 'create' | 'update' }>> {
  const summary: Array<{ id: string; action: 'create' | 'update' }> = []
  for (const p of providers) {
    if (p.id) {
      const updated = await client.contexts.update(p.id, p as never)
      summary.push({ id: updated.id, action: 'update' })
    } else {
      const created = await client.contexts.create(p as never)
      summary.push({ id: created.id, action: 'create' })
    }
  }
  return summary
}

export function registerContexts(program: Command): void {
  const contexts = program.command('contexts').description('Manage context providers')

  contexts
    .command('list')
    .description('List context providers')
    .action(async () => {
      try {
        printResult(await runContextsList(getManagementClient()), program.opts().json ?? false, ['id', 'displayName', 'sourceModel'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  contexts
    .command('get <id>')
    .description('Show a context provider')
    .action(async (id: string) => {
      try {
        printResult(await runContextsGet(getManagementClient(), id), true)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  contexts
    .command('pull')
    .description('Fetch all context providers')
    .option('--out <file>', 'Write JSON to a file (default: stdout)')
    .action(async (opts) => {
      try {
        const providers = await runContextsList(getManagementClient())
        if (opts.out) {
          writeFileSync(opts.out, JSON.stringify(providers, null, 2))
          console.log(`✓ Wrote ${providers.length} provider(s) to ${opts.out}`)
        } else {
          printResult(providers, program.opts().json ?? false, ['id', 'displayName', 'sourceModel'])
        }
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  contexts
    .command('push <file>')
    .description('Create or update context providers from a JSON file')
    .action(async (file: string) => {
      try {
        const providers = JSON.parse(readFileSync(file, 'utf-8')) as ProviderInput[]
        if (!Array.isArray(providers)) {
          throw new Error('Expected the push file to contain a JSON array of context providers.')
        }
        const summary = await runContextsPush(getManagementClient(), providers)
        printResult(summary, program.opts().json ?? false, ['id', 'action'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
