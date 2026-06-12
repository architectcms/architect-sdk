import { Command } from 'commander'
import { writeFileSync, readFileSync } from 'node:fs'
import type { ArchitectManagement } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

type ModelInput = { id?: string; name: string; description?: string; fields?: unknown[] } & Record<string, unknown>

export async function runModelsPull(
  client: ArchitectManagement,
  opts: { out?: string; json?: boolean },
): Promise<void> {
  const models = await client.models.list()
  if (opts.out) {
    writeFileSync(opts.out, JSON.stringify(models, null, 2))
    console.log(`✓ Wrote ${models.length} model(s) to ${opts.out}`)
  } else {
    printResult(models, opts.json ?? false, ['id', 'name'])
  }
}

export async function runModelsPush(
  client: ArchitectManagement,
  file: string,
): Promise<Array<{ name: string; action: 'create' | 'update' }>> {
  const raw = readFileSync(file, 'utf-8')
  const incoming = JSON.parse(raw) as ModelInput[]
  if (!Array.isArray(incoming)) {
    throw new Error('Expected the push file to contain a JSON array of models.')
  }
  const existing = await client.models.list()
  const summary: Array<{ name: string; action: 'create' | 'update' }> = []
  for (const model of incoming) {
    const match = existing.find(m => m.id === model.id || m.name === model.name)
    if (match) {
      await client.models.update(match.id, model as never)
      summary.push({ name: model.name, action: 'update' })
    } else {
      await client.models.create({
        name: model.name,
        description: model.description,
        fields: model.fields as never,
      })
      summary.push({ name: model.name, action: 'create' })
    }
  }
  return summary
}

export function registerModels(program: Command): void {
  const models = program.command('models').description('Manage content models')

  models
    .command('pull')
    .description('Fetch all models from the environment')
    .option('--out <file>', 'Write models JSON to a file (default: stdout)')
    .action(async (opts) => {
      try {
        await runModelsPull(getManagementClient(), { out: opts.out, json: program.opts().json })
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  models
    .command('push <file>')
    .description('Create or update models from a JSON file')
    .action(async (file: string) => {
      try {
        const summary = await runModelsPush(getManagementClient(), file)
        printResult(summary, program.opts().json ?? false, ['name', 'action'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
