import { Command } from 'commander'
import { input, password } from '@inquirer/prompts'
import { loginWithToken } from '../auth/login'
import { printError } from '../output'

export function registerLogin(program: Command): void {
  program
    .command('login')
    .description('Authenticate the CLI')
    .option('--with-token', 'Log in by pasting a management API key')
    .option('--base-url <url>', 'API base URL', 'https://api.architectcms.com')
    .action(async (opts) => {
      try {
        if (!opts.withToken) {
          // Google login is implemented in Phase 2b; until then, guide the user.
          console.log('Google login coming soon. For now use: architect login --with-token')
          return
        }
        const apiKey = await password({ message: 'Management API key (arch_mgmt_…):' })
        const organizationId = await input({ message: 'Organization ID:' })
        const environmentId = await input({ message: 'Environment ID:' })
        await loginWithToken({ apiKey, organizationId, environmentId, baseUrl: opts.baseUrl })
        console.log('✓ Logged in.')
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
