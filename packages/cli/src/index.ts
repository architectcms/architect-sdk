import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Command } from 'commander'
import { registerLogin } from './commands/login'
import { registerWhoami } from './commands/whoami'
import { registerLogout } from './commands/logout'
import { registerModels } from './commands/models'
import { registerContexts } from './commands/contexts'
import { registerEnv } from './commands/env'
import { registerEntries } from './commands/entries'
import { registerTypes } from './commands/types'
import { registerInit } from './commands/init'
import { printError } from './output'

// Read the version from the package's own package.json at runtime so `--version`
// always reflects the installed release. dist/index.js → ../package.json.
const { version } = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string }

const program = new Command()
program
  .name('architect')
  .description('Architect CMS command-line tool')
  .version(version)
  .option('--json', 'Output machine-readable JSON instead of tables')

registerLogin(program)
registerWhoami(program)
registerLogout(program)
registerModels(program)
registerContexts(program)
registerEnv(program)
registerEntries(program)
registerTypes(program)
registerInit(program)

program.parseAsync(process.argv).catch((err) => {
  printError(err)
  process.exit(1)
})
