import { Command } from 'commander'
import { writeFileSync, readFileSync } from 'node:fs'
import type { ArchitectManagement } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

type EntryInput = {
  id?: string
  modelId?: string
  data?: Record<string, unknown>
  version?: number
  createdAt?: string
  updatedAt?: string
} & Record<string, unknown>

/** Resolve a model name-or-id to its canonical model id. */
async function resolveModelId(client: ArchitectManagement, ident: string): Promise<string> {
  const models = await client.models.list()
  const match = models.find(m => m.id === ident || m.name === ident)
  if (!match) {
    throw new Error(`Model not found: ${ident}. Run \`architect models pull\` to see available models.`)
  }
  return match.id
}

/** Extract the field data payload from a pulled-or-authored entry object. */
function entryData(entry: EntryInput): Record<string, unknown> {
  if (entry.data && typeof entry.data === 'object') return entry.data
  const { id, modelId, version, createdAt, updatedAt, ...rest } = entry
  return rest
}

export async function runEntriesPull(
  client: ArchitectManagement,
  opts: { model: string; out?: string; json?: boolean },
): Promise<void> {
  const modelId = await resolveModelId(client, opts.model)
  const entries = await client.entries.model(modelId).fetch()
  if (opts.out) {
    writeFileSync(opts.out, JSON.stringify(entries, null, 2))
    console.log(`✓ Wrote ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} to ${opts.out}`)
  } else {
    printResult(entries, opts.json ?? false, ['id', 'modelId'])
  }
}

export async function runEntriesPush(
  client: ArchitectManagement,
  model: string,
  file: string,
): Promise<Array<{ id: string; action: 'create' | 'update' }>> {
  const incoming = JSON.parse(readFileSync(file, 'utf-8')) as EntryInput[]
  if (!Array.isArray(incoming)) {
    throw new Error('Expected the push file to contain a JSON array of entries.')
  }
  const modelId = await resolveModelId(client, model)
  const summary: Array<{ id: string; action: 'create' | 'update' }> = []
  for (const entry of incoming) {
    const data = entryData(entry)
    if (entry.id) {
      const updated = await client.entries.update(entry.id, data)
      summary.push({ id: updated.id, action: 'update' })
    } else {
      const created = await client.entries.create(modelId, data)
      summary.push({ id: created.id, action: 'create' })
    }
  }
  return summary
}

export function registerEntries(program: Command): void {
  const entries = program.command('entries').description('Manage content entries')

  entries
    .command('pull')
    .description('Fetch entries for a model')
    .requiredOption('--model <name>', 'Model name or id')
    .option('--out <file>', 'Write entries JSON to a file (default: stdout)')
    .action(async (opts) => {
      try {
        await runEntriesPull(getManagementClient(), {
          model: opts.model,
          out: opts.out,
          json: program.opts().json,
        })
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  entries
    .command('push <file>')
    .description('Create or update entries from a JSON file')
    .requiredOption('--model <name>', 'Model name or id')
    .action(async (file: string, opts) => {
      try {
        const summary = await runEntriesPush(getManagementClient(), opts.model, file)
        printResult(summary, program.opts().json ?? false, ['id', 'action'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
