import { Command } from 'commander'
import { clearCredentials } from '../credentials'

export function registerLogout(program: Command): void {
  program.command('logout').description('Remove stored credentials').action(() => {
    clearCredentials()
    console.log('✓ Logged out.')
  })
}
