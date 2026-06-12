import { Command } from 'commander'
import { input, password } from '@inquirer/prompts'
import { loginWithToken } from '../auth/login'
import { printError } from '../output'

export function registerLogin(program: Command): void {
  program
    .command('login')
    .description('Authenticate with a management API key (create one in the web app)')
    .option('--api-key <key>', 'Management API key (arch_mgmt_…)')
    .option('--organization-id <id>', 'Organization id')
    .option('--environment-id <id>', 'Environment id')
    .option('--base-url <url>', 'API base URL', 'https://api.architectcms.com')
    .action(async (opts) => {
      try {
        // Prompt for anything not supplied via flags, so `login` works both
        // interactively and non-interactively (CI: pass all three flags).
        const apiKey = opts.apiKey ?? (await password({ message: 'Management API key (arch_mgmt_…):' }))
        const organizationId = opts.organizationId ?? (await input({ message: 'Organization ID:' }))
        const environmentId = opts.environmentId ?? (await input({ message: 'Environment ID:' }))
        await loginWithToken({ apiKey, organizationId, environmentId, baseUrl: opts.baseUrl })
        console.log('✓ Logged in.')
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
