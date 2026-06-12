import { Command } from 'commander'
import type { ArchitectManagement, Environment } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

export async function runEnvList(client: ArchitectManagement): Promise<Environment[]> {
  return client.environments.list()
}

export async function runEnvCreate(
  client: ArchitectManagement,
  data: { displayName: string; promotesTo?: string },
): Promise<Environment> {
  return client.environments.create(data)
}

export function registerEnv(program: Command): void {
  const env = program.command('env').description('Manage environments')

  env
    .command('list')
    .description('List environments')
    .action(async () => {
      try {
        printResult(await runEnvList(getManagementClient()), program.opts().json ?? false, ['id', 'displayName', 'role', 'promotesTo'])
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })

  env
    .command('create')
    .description('Create an environment')
    .requiredOption('--name <displayName>', 'Display name')
    .option('--promotes-to <id>', 'Environment this one promotes to')
    .action(async (opts) => {
      try {
        const created = await runEnvCreate(getManagementClient(), { displayName: opts.name, promotesTo: opts.promotesTo })
        console.log(`✓ Created environment ${created.id}`)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
