import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import type { ArchitectManagement, LifecycleFunction, LifecycleEvent, LifecycleTiming } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

const VALID_EVENTS: LifecycleEvent[] = ['onCreate', 'onUpdate', 'onDelete']

function parseEvents(events: string): LifecycleEvent[] {
  const parsed = events.split(',').map(e => e.trim()).filter(Boolean)
  const invalid = parsed.filter(e => !VALID_EVENTS.includes(e as LifecycleEvent))
  if (parsed.length === 0 || invalid.length > 0) {
    throw new Error(`Invalid lifecycle event(s): ${invalid.join(', ') || '(none given)'}. Must be one of: ${VALID_EVENTS.join(', ')}`)
  }
  return parsed as LifecycleEvent[]
}

export async function runLifecycleList(client: ArchitectManagement, model: string): Promise<LifecycleFunction[]> {
  return client.lifecycle.list(model)
}

export async function runLifecycleAdd(
  client: ArchitectManagement,
  model: string,
  opts: { name: string; events: string; timing: LifecycleTiming; code: string },
): Promise<LifecycleFunction> {
  const events = parseEvents(opts.events)
  const eventTiming = Object.fromEntries(events.map(e => [e, opts.timing])) as Partial<Record<LifecycleEvent, LifecycleTiming>>
  return client.lifecycle.create(model, {
    name: opts.name,
    events,
    eventTiming,
    code: opts.code,
    enabled: true,
  })
}

export function registerLifecycle(program: Command): void {
  const lc = program.command('lifecycle').description('Manage model lifecycle functions')

  lc.command('list')
    .description('List lifecycle functions for a model')
    .requiredOption('--model <name>', 'Model name or id')
    .action(async (opts) => {
      try {
        printResult(await runLifecycleList(getManagementClient(), opts.model), program.opts().json ?? false, ['id', 'name', 'events', 'enabled'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  lc.command('add')
    .description('Add a lifecycle function to a model')
    .requiredOption('--model <name>', 'Model name or id')
    .requiredOption('--name <name>', 'Function name')
    .requiredOption('--events <list>', 'Comma-separated events: onCreate,onUpdate,onDelete')
    .option('--timing <timing>', "Run 'before' or 'after' the event (onDelete supports 'after' only)", 'after')
    .requiredOption('--code-file <path>', 'JS file with the function body')
    .action(async (opts) => {
      try {
        const code = readFileSync(opts.codeFile, 'utf-8')
        const fn = await runLifecycleAdd(getManagementClient(), opts.model, {
          name: opts.name,
          events: opts.events,
          timing: opts.timing,
          code,
        })
        console.log(`✓ Added lifecycle function ${fn.id} (${opts.events}) to ${opts.model}`)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  // Deletion is by function id alone — the API route is not model-scoped.
  lc.command('rm <id>')
    .description('Remove a lifecycle function by id')
    .action(async (id: string) => {
      try {
        await getManagementClient().lifecycle.delete(id)
        console.log(`✓ Removed ${id}`)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
