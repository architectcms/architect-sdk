import { Command } from 'commander'
import { loadCredentials } from '../credentials'
import { getManagementClient } from '../client'
import { printError } from '../output'

export function registerWhoami(program: Command): void {
  program
    .command('whoami')
    .description('Show the current login')
    .action(async () => {
      try {
        const c = loadCredentials()
        if (!c) { console.log('Not logged in.'); return }
        await getManagementClient().models.list() // verifies the key still works
        console.log(`org=${c.organizationId} env=${c.environmentId} baseUrl=${c.baseUrl} (key valid)`)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
