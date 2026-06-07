import { Command } from 'commander'
import { registerLogin } from './commands/login'
import { registerWhoami } from './commands/whoami'
import { registerLogout } from './commands/logout'
import { registerModels } from './commands/models'
import { registerEntries } from './commands/entries'
import { registerTypes } from './commands/types'
import { registerInit } from './commands/init'
import { printError } from './output'

const program = new Command()
program
  .name('architect')
  .description('Architect CMS command-line tool')
  .version('0.0.0')
  .option('--json', 'Output machine-readable JSON instead of tables')

registerLogin(program)
registerWhoami(program)
registerLogout(program)
registerModels(program)
registerEntries(program)
registerTypes(program)
registerInit(program)

program.parseAsync(process.argv).catch((err) => {
  printError(err)
  process.exit(1)
})
