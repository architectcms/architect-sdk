import { Command } from 'commander'
import type { ArchitectManagement, ContextAction, ContextActionExecuteParams, ContextActionExecuteResult } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

export async function runContextActionsList(client: ArchitectManagement, providerId: string): Promise<ContextAction[]> {
  return client.contextActions.list(providerId)
}

export async function runContextActionExecute(
  client: ArchitectManagement,
  id: string,
  params: ContextActionExecuteParams,
): Promise<ContextActionExecuteResult> {
  return client.contextActions.execute(id, params)
}

export function registerContextActions(program: Command): void {
  const ca = program.command('context-actions').description('Manage and run context actions')

  // The API lists actions per context provider — there is no global collection route.
  ca.command('list')
    .description('List context actions for a provider')
    .requiredOption('--provider <id>', 'Context provider id')
    .action(async (opts) => {
      try {
        printResult(await runContextActionsList(getManagementClient(), opts.provider), program.opts().json ?? false, ['id', 'name', 'enabled'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  ca.command('run <id>')
    .description('Execute a context action on an entry')
    .requiredOption('--entry <entryId>', 'Entry to run the action against')
    .requiredOption('--context-value <value>', 'Context value to execute under (e.g. a locale)')
    .option('--model <modelId>', 'Model of the entry')
    .action(async (id: string, opts) => {
      try {
        const result = await runContextActionExecute(getManagementClient(), id, {
          entryId: opts.entry,
          contextValue: opts.contextValue,
          ...(opts.model ? { modelId: opts.model } : {}),
        })
        printResult(result, true)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
