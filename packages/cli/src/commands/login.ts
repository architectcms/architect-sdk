import { Command } from 'commander'
import { input, password } from '@inquirer/prompts'
import { loginWithToken, loginWithGoogle } from '../auth/login'
import { printError } from '../output'

export function registerLogin(program: Command): void {
  program
    .command('login')
    .description('Authenticate the CLI')
    .option('--with-token', 'Log in by pasting a management API key')
    .option('--org <name>', 'Organization name to create for a brand-new account (Google login)')
    .option('--base-url <url>', 'API base URL', 'https://api.architectcms.com')
    .action(async (opts) => {
      try {
        if (opts.withToken) {
          const apiKey = await password({ message: 'Management API key (arch_mgmt_…):' })
          const organizationId = await input({ message: 'Organization ID:' })
          const environmentId = await input({ message: 'Environment ID:' })
          await loginWithToken({ apiKey, organizationId, environmentId, baseUrl: opts.baseUrl })
        } else {
          await loginWithGoogle(opts.baseUrl, opts.org)
        }
        console.log('✓ Logged in.')
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
